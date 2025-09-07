# MONOMA - Arbitrum-Powered Cross-Chain Stablecoin Settlement Platform

![MONOMA Logo](website/public/logo.png)

**🏆 Built for Arbitrum Hackathon 2024**

MONOMA is a cutting-edge cross-chain stablecoin settlement platform built on Arbitrum, designed specifically for merchants and businesses. It leverages Arbitrum's fast, low-cost infrastructure as the primary settlement destination, enabling seamless stablecoin transfers from multiple source chains with instant settlement and minimal fees.

## 🧠 MONOMA Architecture Mind Map

```
                    🌐 MONOMA ECOSYSTEM 
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            📱 FRONTEND         🔧 BACKEND      📜 SMART CONTRACTS
                    │               │               │
            ┌───────┴───────┐ ┌─────┴─────┐ ┌─────┴─────┐
            │ Next.js dApp  │ │ Node.js   │ │ Factory   │
            │ React UI      │ │ Express   │ │ Contracts │
            │ Vercel Deploy │ │ PostgreSQL│ │ Multi-Chain│
            └───────────────┘ └───────────┘ └───────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            🌐 SOURCE CHAINS    🔄 CROSS-CHAIN    🎯 ARBITRUM
                    │               │               │
            ┌───────┴───────┐ ┌─────┴─────┐ ┌─────┴─────┐
            │ Ethereum      │ │ Circle    │ │ Settlement│
            │ Base          │ │ CCTP v2   │ │ Network   │
            │ Avalanche     │ │ Protocol  │ │ Fast &    │
            │ Polygon       │ │ Attestation│ │ Low-Cost  │
            │ Linea         │ │ Messages  │ │ DeFi Hub  │
            │ Optimism      │ │ Security  │ │ Ecosystem │
            │ Sei           │ │ Trustless │ │ Growth    │
            │ Sonic         │ │ Bridge    │ │ Future    │
            │ Unichain      │ │ Standard  │ │ Ready     │
            │ World Chain   │ │           │ │           │
            └───────────────┘ └───────────┘ └───────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            💰 STABLECOIN FLOW   🏪 MERCHANT USE   🔮 FUTURE VISION
                    │               │               │
            ┌───────┴───────┐ ┌─────┴─────┐ ┌─────┴─────┐
            │ Burn on       │ │ E-commerce│ │   │
            │ Arbitrum      │ │ Management│ │ Integration│
            │ → Fast &      │ │ Non-Custodial│ │ Institutional│
            │ Cheap TX      │ │ Merchant  │ │ Features  │
            │ → DeFi Ready  │ │ Focused   │ │ Advanced  │
            │               │ │ API First │ │ Security  │
            └───────────────┘ └───────────┘ └───────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                            🎯 ARBITRUM ADVANTAGES
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ⚡ PERFORMANCE      💰 COST EFFICIENCY  🔒 SECURITY
                    │               │               │
            ┌───────┴───────┐ ┌─────┴─────┐ ┌─────┴─────┐
            │ Sub-second    │ │ 10x Lower │ │ Ethereum  │
            │ Finality      │ │ Fees      │ │ Security  │
            │ High Throughput│ │ Gas       │ │ Inherited │
            │ Scalable      │ │ Optimized │ │ Battle    │
            │ Fast Settlement│ │ Efficient │ │ Tested    │
            │               │ │           │ │ Proven    │
            └───────────────┘ └───────────┘ └───────────┘

🔄 FLOW: Source Chain → Burn Stablecoin → CCTP v2 → Attestation → Arbitrum → Mint → DeFi Ready
```

## 🌐 Live Demo

- **🚀 Deployed Website**: [http://monoma.vercel.app/](http://monoma.vercel.app/)
- **📹 Demo Video (YouTube)**: [Watch on YouTube](https://youtu.be/xWXXI8PPLfI)
- **📹 Demo Video (Google Drive)**: [Watch Demo](https://drive.google.com/file/d/1ioyxojq-YWU7ee0ZaYTqRgNiel8miDw5/view?usp=sharing)

**Try it now!** Experience seamless cross-chain stablecoin settlement to Arbitrum with our live dApp.

## 🌟 Features

- **Arbitrum-Native Settlement**: All stablecoin transfers settle on Arbitrum for fast, low-cost transactions
- **Cross-Chain to Arbitrum**: Seamlessly transfer stablecoins from Ethereum, Base, and Avalanche to Arbitrum
- **Smart Wallet Factory**: Automated wallet creation with Arbitrum as the destination domain
- **Merchant-Focused**: Built specifically for business and merchant use cases on Arbitrum
- **Circle CCTP Integration**: Leverages Circle's Cross-Chain Transfer Protocol for secure Arbitrum settlements
- **Arbitrum-Optimized**: Takes advantage of Arbitrum's speed and cost efficiency
- **RESTful API**: Easy integration with existing merchant systems
- **Real-time Status Tracking**: Monitor transaction status across all chains with Arbitrum settlement

## 🏗️ Architecture

MONOMA consists of three main components:

1. **Smart Contracts**: Factory contracts deployed on each supported chain
2. **Backend Server**: Node.js API server handling cross-chain operations
3. **Frontend Website**: React/Next.js interface for merchants

### Arbitrum-Centric Cross-Chain Flow

```
Source Chains (ETH/Base/Avalanche) → Circle CCTP → 🎯 ARBITRUM (Primary Settlement)
     ↓                                      ↓
  Burn Stablecoin                   Mint Stablecoin on Arbitrum
     ↓                                      ↓
  Smart Wallet                        Arbitrum Message Transmitter
     ↓                                      ↓
  Cross-Chain Message                ✅ Fast & Low-Cost Settlement
```

**Why Arbitrum?**
- ⚡ **Speed**: Sub-second transaction finality
- 💰 **Cost**: 10x lower fees than Ethereum mainnet
- 🔒 **Security**: Inherits Ethereum's security
- 🌐 **Ecosystem**: Growing DeFi and merchant adoption

## 📋 Supported Networks

### 🎯 Primary Settlement Network
| Network | Chain ID | Factory Address | Status | Role |
|---------|----------|-----------------|---------|------|
| **Arbitrum Sepolia** | 421614 | `0x1142cCaA7F3bCe84D2E5F2eCD22F17EE4b31129e` | ✅ **PRIMARY** | **Settlement Destination** |

### 🌐 Source Networks (Burn → Arbitrum)
| Network | Chain ID | Factory Address | Status | Role |
|---------|----------|-----------------|---------|------|
| **Ethereum Sepolia** | 11155111 | `0xb406e710a4c55b581f2d53d4a05c88c4382f7d69` | ✅ Active | Source Chain |
| **Base Sepolia** | 84532 | `0x97d6bfe60bdc2424c62c97adb2b8f703292f7f3d` | ✅ Active | Source Chain |
| **Avalanche Fuji** | 43113 | `0x8d38296ee5dc3b4425a64cb6929cff88e73c54d3` | ✅ Active | Source Chain |

### Coming Soon
- **Polygon PoS Amoy**
- **Linea Sepolia**
- **OP Sepolia**
- **Sonic Testnet**
- **Sei Testnet**
- **Unichain Sepolia**
- **WorldChain Sepolia**

## 🚀 Quick Start

### 🌐 Try the Live Demo First!

Before setting up locally, experience MONOMA with our live deployment:
- **Live dApp**: [http://monoma.vercel.app/](http://monoma.vercel.app/)
- **Demo Video (YouTube)**: [Watch on YouTube](https://youtu.be/xWXXI8PPLfI)
- **Demo Video (Google Drive)**: [Watch Demo](https://drive.google.com/file/d/1ioyxojq-YWU7ee0ZaYTqRgNiel8miDw5/view?usp=sharing)


The platform is designed with Arbitrum as the primary settlement destination:

- **Fixed Destination Domain**: `3` (Arbitrum) for all cross-chain transfers
- **Arbitrum Message Transmitter**: `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275`
- **Optimized for Arbitrum**: All smart contracts and infrastructure optimized for Arbitrum's capabilities
- **Low-Cost Settlement**: Leverages Arbitrum's 10x lower fees compared to Ethereum mainnet

## 🏪 Merchant Integration

MONOMA is specifically designed for merchant use cases:

### Use Cases
- **E-commerce**: Accept stablecoin payments from any supported chain, settle on Arbitrum
- **Cross-Chain to Arbitrum**: Send payments from multiple chains to Arbitrum addresses
- **Liquidity Management**: Consolidate stablecoins from multiple chains to Arbitrum
- **Arbitrum Settlement**: Automated settlement to Arbitrum for fast, low-cost transactions
- **DeFi Integration**: Seamlessly integrate with Arbitrum's growing DeFi ecosystem

### Integration Steps
1. Set up your merchant account with MONOMA
2. Configure your Arbitrum destination address
3. Integrate API endpoints into your payment system
4. Monitor cross-chain transactions with Arbitrum settlement
5. Leverage Arbitrum's ecosystem for additional DeFi operations

## 🔒 Security Features

- **Private Key Management**: Secure handling of operational keys
- **Retry Logic**: Robust error handling and retry mechanisms
- **Attestation Verification**: Circle CCTP attestation validation
- **Database Security**: PostgreSQL with proper indexing and constraints

## 🧪 Testing

### Testnet Configuration
All contracts are deployed on testnets for development and testing:

- **Arbitrum Sepolia**: Primary settlement network with test ETH and stablecoins
- **Ethereum Sepolia**: Source chain with test ETH and stablecoins
- **Base Sepolia**: Source chain with test ETH and stablecoins  
- **Avalanche Fuji**: Source chain with test AVAX and stablecoins


*MONOMA - Making cross-chain payments simple, secure, and Arbitrum-native*
