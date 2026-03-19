import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface MapPoint {
  coordinates: [number, number]; // [lng, lat]
  label: string;
  detail?: string;
  risk: 'critical' | 'high' | 'alert' | 'stable' | 'unknown' | 'satellite';
}

export function HeatMap2D({ points = [] }: { points?: MapPoint[] }) {
  const [activeTooltip, setActiveTooltip] = useState<MapPoint | null>(null);

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'critical': return '#ef4444'; // red
      case 'high': return '#f97316'; // orange
      case 'alert': return '#f59e0b'; // amber
      case 'stable': return '#10b981'; // emerald
      case 'satellite': return '#c084fc'; // purple
      default: return '#06b6d4'; // cyan
    }
  };

  // Simulated orbital tracks
  const issTrack: [number, number][] = [
    [-120, 20], [-90, 35], [-60, 45], [-30, 45], [0, 35], [30, 20], [60, -5], [90, -30], [120, -45], [150, -45]
  ];

  return (
    <div className="w-full h-full relative flex items-center justify-center p-0" style={{ minHeight: '380px' }}>
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.1) 2px, rgba(0,255,200,0.1) 4px)' }} />

      {/* MAP */}
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120, center: [10, 25] }} style={{ width: '100%', height: '100%', outline: 'none' }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(255, 255, 255, 0.05)"
                stroke="rgba(0, 255, 200, 0.15)"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "rgba(0, 255, 200, 0.15)", outline: "none", stroke: "rgba(0, 255, 200, 0.4)" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {points.map((point, index) => {
          const color = getRiskColor(point.risk);
          return (
            <Marker 
              key={index} 
              coordinates={point.coordinates}
              onMouseEnter={() => setActiveTooltip(point)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <g className="cursor-pointer group">
                <circle r={9} fill={color} className="opacity-20 group-hover:opacity-40 animate-ping transition-opacity" />
                <circle r={3.5} fill={color} className="opacity-80 shadow-[0_0_10px_currentColor] group-hover:opacity-100" />
                <text
                  textAnchor="middle"
                  y={-12}
                  style={{ fontFamily: "monospace", fontSize: "7px", fill: color, fontWeight: "bold", userSelect: "none" }}
                  className="opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-md"
                >
                  {point.label}
                </text>
              </g>
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Absolute Tooltip UI */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="bg-black/90 border border-white/10 p-2.5 rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-md max-w-[240px]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: getRiskColor(activeTooltip.risk) }} />
                <span className="text-[10px] font-bold tracking-wider text-white truncate uppercase">{activeTooltip.label}</span>
              </div>
              <p className="text-[9px] text-white/50 leading-relaxed font-mono">
                {activeTooltip.detail || "Location monitored by global grid. Impact vectors under analysis limit."}
              </p>
              <div className="mt-1.5 pt-1.5 border-t border-white/5 flex gap-2">
                 <span className="text-[7px] text-white/30 uppercase">Lat: {activeTooltip.coordinates[1].toFixed(2)}</span>
                 <span className="text-[7px] text-white/30 uppercase">Lng: {activeTooltip.coordinates[0].toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500/30"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500/30"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500/30"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500/30"></div>
    </div>
  );
}
