"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DottedMap from "dotted-map";
import Image from "next/image";
import { useTheme } from "next-themes";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
  showLabels?: boolean;
  labelClassName?: string;
  animationDuration?: number;
  loop?: boolean;
}

export function WorldMap({ 
  dots = [], 
  lineColor = "#0ea5e9",
  showLabels = true,
  labelClassName = "text-sm",
  animationDuration = 2,
  loop = true
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [currentLogos, setCurrentLogos] = useState<string[]>([]);
  const { theme } = useTheme();

  // All available chain logos
  const allChains = [
    "Ethereum", "Avalanche", "Base", "Linea", "OP Mainnet", 
    "Polygon PoS", "Sei", "Solana", "Sonic", "Unichain", 
    "World Chain", "Codex"
  ];

  // Fixed positions for the 5 logo spots (randomly adjusted 3-4cm)
  const fixedPositions = [
    { x: 520, y: 110 },  // Position 1 (left 3cm, down 3cm)
    { x: 650, y: 90 },   // Position 2 (right 3cm, up 3cm)
    { x: 700, y: 170 },  // Position 3 (right 3cm, up 3cm)
    { x: 620, y: 190 },  // Position 4 (left 3cm, down 3cm)
    { x: 630, y: 320 }   // Position 5 (right 3cm, down 3cm)
  ];

  // Rotate each position independently every 2 seconds
  useEffect(() => {
    const rotateLogos = () => {
      // Create 5 random logos independently
      const newLogos = [];
      for (let i = 0; i < 5; i++) {
        const randomChain = allChains[Math.floor(Math.random() * allChains.length)];
        newLogos.push(randomChain);
      }
      setCurrentLogos(newLogos);
    };

    // Set initial logos
    rotateLogos();

    // Rotate every 2 seconds
    const interval = setInterval(rotateLogos, 2000);

    return () => clearInterval(interval);
  }, []);

  // Create fixed connection lines that don't change with logo rotation
  const fixedConnections = useMemo(() => {
    return fixedPositions.map((position, index) => ({
      start: position,
      end: { x: 300, y: 300 }, // Arbitrum position
      id: `connection-${index}`
    }));
  }, []);

  const getChainLogo = (chainName: string) => {
    const logos: { [key: string]: string } = {
      "Ethereum": "https://cdn-icons-png.flaticon.com/128/14446/14446160.png",
      "Avalanche": "https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/avalanche.png",
      "Base": "https://avatars.githubusercontent.com/u/108554348?s=280&v=4",
      "Linea": "https://moralis.com/wp-content/uploads/2024/04/Linea-Chain-Icon.svg",
      "OP Mainnet": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqidBq62tBzMjwxpb9WljM3BuKe6oEHzbJ6Q&s",
      "Polygon PoS": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-UjZYpTKlVQWhKF3Sf3camP-rCTZ_OZnqcA&s",
      "Sei": "https://tw.mitrade.com/cms_uploads/img/20230816/9fa1c5943c8af63ea49970c8697e986c.jpg",
      "Solana": "https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/solana.png",
      "Sonic": "https://s2.coinmarketcap.com/static/img/coins/200x200/32684.png",
      "Unichain": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIOk2BmIfo12hx0k8FiNNC9MJgop2AAEIoFg&s",
      "World Chain": "https://static1.tokenterminal.com//worldchain/logo.png?logo_hash=786762db10d4891532210e063b6501ac6ad715a9",
      "Codex": "https://cdn-icons-png.flaticon.com/128/14446/14446160.png",
      "Arbitrum": "https://cdn3d.iconscout.com/3d/premium/thumb/arbitrum-arb-3d-icon-png-download-11757502.png"
    };
    return logos[chainName] || "";
  };

  const map = useMemo(
    () => new DottedMap({ height: 100, grid: "diagonal" }),
    []
  );

  const svgMap = useMemo(
    () => map.getSVG({
      radius: 0.22,
      color: theme === "dark" ? "#FFFF7F20" : "#00000020",
      shape: "circle",
      backgroundColor: "transparent",
    }),
    [map, theme]
  );

  const projectPoint = (lat: number, lng: number) => {
    // For Arbitrum (0,0), position it on the left side where the text is
    if (lat === 0 && lng === 0) {
      return { x: 300, y: 300 }; // Left side of screen (moved 1cm more right)
    }
    
    // Map coordinates to fixed positions
    const coords = [
      { lat: 40.7128, lng: -74.0060, name: "Ethereum" },
      { lat: 35.6762, lng: 139.6503, name: "Solana" },
      { lat: 1.3521, lng: 103.8198, name: "Polygon PoS" },
      { lat: -33.8688, lng: 151.2093, name: "Linea" },
      { lat: 22.3193, lng: 114.1694, name: "Sonic" },
      { lat: -23.5505, lng: -46.6333, name: "World Chain" },
      { lat: 51.5074, lng: -0.1278, name: "Base" },
      { lat: 37.7749, lng: -122.4194, name: "Avalanche" },
      { lat: 52.5200, lng: 13.4050, name: "OP Mainnet" },
      { lat: 25.2048, lng: 55.2708, name: "Sei" },
      { lat: 55.7558, lng: 37.6176, name: "Unichain" },
      { lat: 19.4326, lng: -99.1332, name: "Codex" }
    ];
    
    const matchingCoord = coords.find(coord => 
      Math.abs(coord.lat - lat) < 0.1 && Math.abs(coord.lng - lng) < 0.1
    );
    
    if (matchingCoord && currentLogos.includes(matchingCoord.name)) {
      // Get the position index for this logo in the current rotation
      const logoIndex = currentLogos.indexOf(matchingCoord.name);
      if (logoIndex !== -1 && logoIndex < fixedPositions.length) {
        return fixedPositions[logoIndex];
      }
    }
    
    // Hide logos that are not in the current rotation
    return { x: -1000, y: -1000 };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    // Create a smooth curve from right side chains to left side Arbitrum
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 30;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  // Calculate animation timing
  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2; // Pause for 2 seconds when all paths are drawn
  const fullCycleDuration = totalAnimationTime + pauseTime;

  return (
    <div className="w-full aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[2/1] bg-transparent rounded-lg relative font-sans overflow-hidden">
      <Image
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none object-cover"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
        priority
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-auto select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          
          <filter id="glow">
            <feMorphology operator="dilate" radius="0.5" />
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {fixedConnections.map((connection, i) => {
          // Calculate keyframe times for this specific path
          const startTime = (i * staggerDelay) / fullCycleDuration;
          const endTime = (i * staggerDelay + animationDuration) / fullCycleDuration;
          const resetTime = totalAnimationTime / fullCycleDuration;
          
          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(connection.start, connection.end)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={loop ? {
                  pathLength: [0, 0, 1, 1, 0],
                } : {
                  pathLength: 1
                }}
                transition={loop ? {
                  duration: fullCycleDuration,
                  times: [0, startTime, endTime, resetTime, 1],
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0,
                } : {
                  duration: animationDuration,
                  delay: i * staggerDelay,
                  ease: "easeInOut",
                }}
              />
              
              {loop && (
                <motion.circle
                  r="4"
                  fill={lineColor}
                  initial={{ offsetDistance: "0%", opacity: 0 }}
                  animate={{
                    offsetDistance: [null, "0%", "100%", "100%", "100%"],
                    opacity: [0, 0, 1, 0, 0],
                  }}
                  transition={{
                    duration: fullCycleDuration,
                    times: [0, startTime, endTime, resetTime, 1],
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0,
                  }}
                  style={{
                    offsetPath: `path('${createCurvedPath(connection.start, connection.end)}')`,
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Fixed logo positions - only show current rotating logos */}
        {fixedPositions.map((position, i) => {
          const currentLogo = currentLogos[i];
          if (!currentLogo) return null;
          
          return (
            <g key={`logo-position-${i}`}>
              <motion.g
                onHoverStart={() => setHoveredLocation(currentLogo)}
                onHoverEnd={() => setHoveredLocation(null)}
                className="cursor-pointer"
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="3"
                  fill={lineColor}
                  filter="url(#glow)"
                  className="drop-shadow-lg"
                />
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="3"
                  fill={lineColor}
                  opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    from="3"
                    to="12"
                    dur="2s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.6"
                    to="0"
                    dur="2s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                </circle>
              </motion.g>
              
              {showLabels && (
                <motion.g
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 * i + 0.3, duration: 0.5 }}
                  className="pointer-events-none"
                >
                  <foreignObject
                    x={position.x - 20}
                    y={position.y - 20}
                    width="40"
                    height="40"
                    className="block"
                  >
                    <div className="flex items-center justify-center h-full">
                      <img
                        src={getChainLogo(currentLogo)}
                        alt={currentLogo}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  </foreignObject>
                </motion.g>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Mobile Tooltip */}
      <AnimatePresence>
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 text-black dark:text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm sm:hidden border border-gray-200 dark:border-gray-700"
          >
            {hoveredLocation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
