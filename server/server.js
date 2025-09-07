require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3011;

// Middleware
app.use(cors());
app.use(express.json());

// Fixed destination domain
const DESTINATION_DOMAIN = parseInt(process.env.DESTINATION_DOMAIN) || 3;

// Shared config
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const FACTORY_ABI = [
  "function owner() external view returns (address)",
  "function createSingleWallet(uint32 destinationDomain, bytes32 mintRecipient) external returns (address walletAddress)",
  "event WalletCreated(address indexed wallet, uint32 destinationDomain, bytes32 mintRecipient)"
];

// Chain configs (testnets as used in existing server)
const CHAIN_CONFIGS = {
  eth: {
    rpc: process.env.ETH_RPC_URL,
    factory: process.env.ETH_FACTORY_ADDRESS,
    label: "ETH Sepolia"
  },
  base: {
    rpc: process.env.BASE_RPC_URL,
    factory: process.env.BASE_FACTORY_ADDRESS,
    label: "Base Sepolia"
  },
  avalanche: {
    rpc: process.env.AVALANCHE_RPC_URL,
    factory: process.env.AVALANCHE_FACTORY_ADDRESS,
    label: "Avalanche Fuji"
  }
};

// Burn USDC configs
const BURN_CONFIGS = {
  eth: {
    rpc: process.env.ETH_BURN_RPC_URL,
    label: "ETH Sepolia",
    chainId: parseInt(process.env.ETH_CHAIN_ID) || 0
  },
  base: {
    rpc: process.env.BASE_BURN_RPC_URL,
    label: "Base Sepolia",
    chainId: parseInt(process.env.BASE_CHAIN_ID) || 6
  },
  avalanche: {
    rpc: process.env.AVALANCHE_BURN_RPC_URL,
    label: "Avalanche Fuji",
    chainId: parseInt(process.env.AVALANCHE_CHAIN_ID) || 1
  }
};

// Arbitrum mint config
const ARBITRUM_CONFIG = {
  rpc: process.env.ARBITRUM_RPC_URL,
  messageTransmitter: process.env.ARBITRUM_MESSAGE_TRANSMITTER
};

const MESSAGE_TRANSMITTER_ABI = [
  {
    type: 'function',
    name: 'receiveMessage',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [],
  },
];

// --- Generic retry wrapper for any action ---
async function runWithRetries(action, { maxAttempts = 3, baseDelayMs = 1000 } = {}) {
  let attempt = 0;
  let lastErr;
  while (attempt < maxAttempts) {
    try {
      attempt++;
      return await action();
    } catch (err) {
      lastErr = err;
      if (attempt >= maxAttempts) break;
      const delay = baseDelayMs * attempt;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// --- Database (from env) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS monomausers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        smartwallets JSONB,
        account BOOLEAN DEFAULT false,
        chains TEXT,
        destined_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_monomausers_email ON monomausers(email)`);
    // Requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS monomarequests (
        payid VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        smartwallets JSONB,
        amount DECIMAL(18,8),
        status VARCHAR(50),
        hash VARCHAR(255),
        descriptions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Migrate existing schema if it was created with SERIAL
    await client.query(`DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='monomarequests' AND column_name='payid' AND data_type IN ('integer','bigint')
      ) THEN
        ALTER TABLE monomarequests ALTER COLUMN payid DROP DEFAULT;
        ALTER TABLE monomarequests ALTER COLUMN payid TYPE VARCHAR(64);
      END IF;
    END $$;`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_monomarequests_email ON monomarequests(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_monomarequests_payid ON monomarequests(payid)`);
    console.log('✅ monomausers table ready');
    console.log('✅ monomarequests table ready');
  } finally {
    client.release();
  }
}

function isRetryableNetworkError(err) {
  const message = (err && err.message ? err.message : '').toLowerCase();
  const code = err && err.code ? String(err.code) : '';
  // Common transient/network conditions
  return (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('network error') ||
    message.includes('getaddrinfo') ||
    message.includes('enotfound') ||
    message.includes('dns') ||
    message.includes('socket hang up') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('failed to detect network') ||
    message.includes('cannot start up') ||
    message.includes('503') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    code === 'NETWORK_ERROR' ||
    code === 'ENOTFOUND' ||
    code === 'SERVER_ERROR' ||
    code === 'TIMEOUT'
  );
}

async function createWalletOnChain(chainKey, mintRecipient) {
  const cfg = CHAIN_CONFIGS[chainKey];
  if (!cfg) {
    throw new Error(`Unsupported chain ${chainKey}. Use eth, base, avalanche.`);
  }

  let attempts = 0;
  const maxAttempts = 6;
  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`🔄 ${cfg.label} attempt ${attempts} to create wallet...`);

      // Recreate provider/signer/contract each attempt to recover from provider startup issues
      const provider = new ethers.JsonRpcProvider(cfg.rpc);
      const signer = new ethers.Wallet(PRIVATE_KEY, provider);
      const factory = new ethers.Contract(cfg.factory, FACTORY_ABI, signer);

      // Verify ownership like existing server
      const owner = await factory.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        throw new Error("Not factory owner");
      }

      const tx = await factory.createSingleWallet(DESTINATION_DOMAIN, mintRecipient);
      const receipt = await tx.wait();

      const eventLog = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "WalletCreated";
        } catch {
          return false;
        }
      });

      if (!eventLog) throw new Error("Wallet creation failed - no event found");

      const parsed = factory.interface.parseLog(eventLog);
      const walletAddress = parsed.args.wallet;
      console.log(`✅ ${cfg.label} wallet: ${walletAddress}`);
      return walletAddress;
    } catch (err) {
      console.error(`❌ ${cfg.label} attempt ${attempts} failed:`, err.message);
      // Retry on ANY error type
      if (attempts >= maxAttempts) throw err;
      const backoffMs = 1500 * attempts;
      await new Promise(r => setTimeout(r, backoffMs));
    }
  }
}

// --- Fetch attestation from Circle API ---
async function fetchAttestation(chainId, transactionHash) {
  const baseUrl = process.env.CIRCLE_API_BASE_URL || 'https://iris-api-sandbox.circle.com';
  const url = `${baseUrl}/v2/messages/${chainId}?transactionHash=${transactionHash}`;
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`🔄 Attempt ${attempts} to fetch attestation for ${transactionHash}...`);
      
      // Wait 10 seconds before first attempt, then 5 seconds between retries
      if (attempts === 1) {
        await new Promise(r => setTimeout(r, 10000));
      } else {
        await new Promise(r => setTimeout(r, 5000));
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        const message = data.messages[0];
        if (message.attestation && message.status === 'complete') {
          console.log(`✅ Attestation fetched: ${message.attestation.substring(0, 20)}...`);
          return {
            attestation: message.attestation,
            message: message.message,
            status: message.status
          };
        }
      }
      
      console.log(`⏳ Attestation not ready yet (attempt ${attempts}/${maxAttempts})`);
      
    } catch (error) {
      console.error(`❌ Error fetching attestation (attempt ${attempts}):`, error.message);
      if (attempts >= maxAttempts) throw error;
    }
  }
  
  throw new Error('Failed to fetch attestation after maximum attempts');
}

// --- Mint on Arbitrum using attestation ---
async function mintOnArbitrum(attestation, message) {
  const provider = new ethers.JsonRpcProvider(ARBITRUM_CONFIG.rpc);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  const contract = new ethers.Contract(ARBITRUM_CONFIG.messageTransmitter, MESSAGE_TRANSMITTER_ABI, signer);
  
  console.log(`🪙 Minting on Arbitrum with attestation...`);
  const tx = await contract.receiveMessage(message, attestation);
  const receipt = await tx.wait();
  
  console.log(`✅ Arbitrum mint success: ${tx.hash}`);
  return {
    chain: 'arbitrum',
    transactionHash: tx.hash,
    gasUsed: receipt.gasUsed.toString()
  };
}

// --- Burn USDC function ---
async function burnUSDCOnChain(chainKey, walletAddress, amount) {
  const cfg = BURN_CONFIGS[chainKey];
  if (!cfg) {
    throw new Error(`Unsupported chain ${chainKey}. Use eth, base, avalanche.`);
  }

  const provider = new ethers.JsonRpcProvider(cfg.rpc);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const abi = [
    {
      name: "burnUSDC",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [{ name: "amount", type: "uint256" }],
      outputs: [],
    },
  ];

  const contract = new ethers.Contract(walletAddress, abi, signer);

  console.log(`🔥 ${cfg.label} burning ${amount} wei from ${walletAddress}`);
  const tx = await contract.burnUSDC(amount);
  const receipt = await tx.wait();

  console.log(`✅ ${cfg.label} burn success: ${tx.hash}`);
  
  // Fetch attestation and mint on Arbitrum
  console.log(`⏳ Waiting for attestation...`);
  const attestationData = await fetchAttestation(cfg.chainId, tx.hash);
  
  console.log(`🪙 Minting on Arbitrum...`);
  const mintResult = await mintOnArbitrum(attestationData.attestation, attestationData.message);
  
  return {
    chain: chainKey,
    transactionHash: tx.hash,
    gasUsed: receipt.gasUsed.toString(),
    walletAddress,
    amountBurned: amount,
    attestation: attestationData.attestation,
    arbitrumMint: mintResult
  };
}

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'monoma-server', destinationDomain: DESTINATION_DOMAIN });
});

// --- Monoma Users API ---
// Upsert user by email
app.post('/api/monomausers', async (req, res) => {
  try {
    const { email, smartwallets, account, chains, destinedAddress } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const handler = async () => {
      const existing = await pool.query('SELECT * FROM monomausers WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        const fields = [];
        const values = [email];
        let n = 1;
        if (smartwallets !== undefined) { fields.push(`smartwallets = $${++n}`); values.push(smartwallets); }
        if (account !== undefined) { fields.push(`account = $${++n}`); values.push(account); }
        if (chains !== undefined) { fields.push(`chains = $${++n}`); values.push(chains); }
        if (destinedAddress !== undefined) { fields.push(`destined_address = $${++n}`); values.push(destinedAddress); }
        if (fields.length === 0) {
          return { status: 400, body: { error: 'no fields to update' } };
        }
        const result = await pool.query(`
          UPDATE monomausers
          SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE email = $1
          RETURNING *
        `, values);
        return { status: 200, body: { user: result.rows[0] } };
      } else {
        const result = await pool.query(`
          INSERT INTO monomausers (email, smartwallets, account, chains, destined_address)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [email, smartwallets || null, account === true, chains || null, destinedAddress || null]);
        return { status: 201, body: { user: result.rows[0] } };
      }
    };

    const outcome = await runWithRetries(handler, { maxAttempts: 5, baseDelayMs: 500 });
    if (outcome.status !== 200 && outcome.status !== 201) {
      return res.status(outcome.status).json(outcome.body);
    }
    return res.status(outcome.status).json(outcome.body);
  } catch (err) {
    console.error('Error in POST /api/monomausers:', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// --- Monoma Requests API ---
// Create a new request
app.post('/api/monomarequests', async (req, res) => {
  try {
    const { payid, email, smartwallets, amount, status, hash, descriptions } = req.body || {};
    if (!email || !amount) {
      return res.status(400).json({ error: 'email and amount are required' });
    }

    const handler = async () => {
      const id = payid || null;
      const result = await pool.query(`
        INSERT INTO monomarequests (payid, email, smartwallets, amount, status, hash, descriptions)
        VALUES (COALESCE($1, CONCAT('REQ', EXTRACT(EPOCH FROM NOW())::bigint::text, '-', floor(random()*1e6)::bigint::text)), $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [id, email, smartwallets || null, amount, status || null, hash || null, descriptions || null]);
      return { status: 201, body: { request: result.rows[0] } };
    };

    const outcome = await runWithRetries(handler, { maxAttempts: 5, baseDelayMs: 500 });
    return res.status(outcome.status).json(outcome.body);
  } catch (err) {
    console.error('Error in POST /api/monomarequests:', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Get request by payid
app.get('/api/monomarequests/:payid', async (req, res) => {
  try {
    const { payid } = req.params;
    const handler = async () => {
      const result = await pool.query('SELECT * FROM monomarequests WHERE payid = $1', [payid]);
      if (result.rows.length === 0) return { status: 404, body: { error: 'not found' } };
      return { status: 200, body: { request: result.rows[0] } };
    };
    const outcome = await runWithRetries(handler, { maxAttempts: 5, baseDelayMs: 500 });
    return res.status(outcome.status).json(outcome.body);
  } catch (err) {
    console.error('Error in GET /api/monomarequests/:payid:', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Get all requests by email
app.get('/api/monomarequests/mail/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const handler = async () => {
      const result = await pool.query('SELECT * FROM monomarequests WHERE email = $1 ORDER BY created_at DESC', [email]);
      return { status: 200, body: { count: result.rows.length, requests: result.rows } };
    };
    const outcome = await runWithRetries(handler, { maxAttempts: 5, baseDelayMs: 500 });
    return res.status(outcome.status).json(outcome.body);
  } catch (err) {
    console.error('Error in GET /api/monomarequests/mail/:email:', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Update status and/or hash by payid
app.patch('/api/monomarequests/:payid', async (req, res) => {
  try {
    const { payid } = req.params;
    const { status, hash, descriptions } = req.body || {};

    const handler = async () => {
      const exists = await pool.query('SELECT 1 FROM monomarequests WHERE payid = $1', [payid]);
      if (exists.rows.length === 0) return { status: 404, body: { error: 'not found' } };
      const fields = [];
      const values = [payid];
      let n = 1;
      if (status !== undefined) { fields.push(`status = $${++n}`); values.push(status); }
      if (hash !== undefined) { fields.push(`hash = $${++n}`); values.push(hash); }
      if (descriptions !== undefined) { fields.push(`descriptions = $${++n}`); values.push(descriptions); }
      if (fields.length === 0) return { status: 400, body: { error: 'no fields to update' } };
      const result = await pool.query(`
        UPDATE monomarequests
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE payid = $1
        RETURNING *
      `, values);
      return { status: 200, body: { request: result.rows[0] } };
    };

    const outcome = await runWithRetries(handler, { maxAttempts: 5, baseDelayMs: 500 });
    return res.status(outcome.status).json(outcome.body);
  } catch (err) {
    console.error('Error in PATCH /api/monomarequests/:payid:', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Get user by email
app.get('/api/monomausers/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const handler = async () => {
      const result = await pool.query('SELECT * FROM monomausers WHERE email = $1', [email]);
      if (result.rows.length === 0) return { status: 404, body: { error: 'not found' } };
      return { status: 200, body: { user: result.rows[0] } };
    };
    const outcome = await runWithRetries(handler, { maxAttempts: 5, baseDelayMs: 500 });
    return res.status(outcome.status).json(outcome.body);
  } catch (err) {
    console.error('Error in GET /api/monomausers/:email:', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Update all user fields by email (partial allowed; updates provided fields)
app.patch('/api/monomausers/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { smartwallets, account, chains, destinedAddress } = req.body || {};

    const handler = async () => {
      const exists = await pool.query('SELECT 1 FROM monomausers WHERE email = $1', [email]);
      if (exists.rows.length === 0) return { status: 404, body: { error: 'not found' } };

      const fields = [];
      const values = [email];
      let n = 1;
      if (smartwallets !== undefined) { fields.push(`smartwallets = $${++n}`); values.push(smartwallets); }
      if (account !== undefined) { fields.push(`account = $${++n}`); values.push(account); }
      if (chains !== undefined) { fields.push(`chains = $${++n}`); values.push(chains); }
      if (destinedAddress !== undefined) { fields.push(`destined_address = $${++n}`); values.push(destinedAddress); }
      if (fields.length === 0) return { status: 400, body: { error: 'no fields to update' } };

      const result = await pool.query(`
        UPDATE monomausers
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE email = $1
        RETURNING *
      `, values);
      return { status: 200, body: { user: result.rows[0] } };
    };

    const outcome = await runWithRetries(handler, { maxAttempts: 5, baseDelayMs: 500 });
    return res.status(outcome.status).json(outcome.body);
  } catch (err) {
    console.error('Error in PATCH /api/monomausers/:email:', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// --- Burn USDC API ---
// Burn USDC from wallet on specific chain
app.post('/api/burn-usdc/:chain', async (req, res) => {
  try {
    const chain = (req.params.chain || '').toLowerCase();
    const { walletAddress, amount } = req.body;
    if (!walletAddress || !amount) {
      return res.status(400).json({ error: 'walletAddress and amount are required' });
    }

    const handler = async () => {
      return await burnUSDCOnChain(chain, walletAddress, amount);
    };

    const result = await runWithRetries(handler, { maxAttempts: 5, baseDelayMs: 1000 });
    res.json(result);
  } catch (error) {
    console.error('Error in POST /api/burn-usdc/:chain:', error);
    res.status(500).json({ error: error.message || 'Internal error' });
  }
});

// Create wallet for a specific chain (fixed destinationDomain=3)
// Body: { mintRecipient: bytes32-string }
app.post('/api/create-wallet/:chain', async (req, res) => {
  try {
    const chain = (req.params.chain || '').toLowerCase();
    const { mintRecipient } = req.body;
    if (!mintRecipient) {
      return res.status(400).json({ error: 'mintRecipient is required (bytes32)' });
    }
    const address = await createWalletOnChain(chain, mintRecipient);
    res.set('Content-Type', 'text/plain');
    res.send(`${chain.toUpperCase()}: ${address}`);
  } catch (error) {
    console.error('Error in POST /api/create-wallet/:chain:', error);
    res.status(500).json({ error: error.message || 'Internal error' });
  }
});

// Create wallets on all three chains with a single call
// Body: { mintRecipient: bytes32-string }
app.post('/api/create-wallet-all', async (req, res) => {
  try {
    const { mintRecipient } = req.body;
    if (!mintRecipient) {
      return res.status(400).json({ error: 'mintRecipient is required (bytes32)' });
    }

    const lines = [];
    for (const chain of ["eth", "base", "avalanche"]) {
      try {
        const addr = await createWalletOnChain(chain, mintRecipient);
        lines.push(`${chain.toUpperCase()}: ${addr}`);
      } catch (e) {
        // omit failures to satisfy "only chain name : address"
      }
    }

    res.set('Content-Type', 'text/plain');
    res.send(lines.join('\n'));
  } catch (error) {
    console.error('Error in POST /api/create-wallet-all:', error);
    res.status(500).json({ error: error.message || 'Internal error' });
  }
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Monoma server running on port ${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('  GET    /health');
    console.log('  POST   /api/monomausers');
    console.log('  GET    /api/monomausers/:email');
    console.log('  POST   /api/monomarequests');
    console.log('  GET    /api/monomarequests/:payid');
    console.log('  GET    /api/monomarequests/mail/:email');
    console.log('  PATCH  /api/monomarequests/:payid');
    console.log('  POST   /api/burn-usdc/:chain       { walletAddress, amount }');
    console.log('  POST   /api/create-wallet/:chain   { mintRecipient }');
    console.log('  POST   /api/create-wallet-all      { mintRecipient }');
    console.log('  Fixed destinationDomain = 3');
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


