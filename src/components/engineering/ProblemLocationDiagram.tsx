import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Problem {
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  impact: string;
  location?: string;
}

interface ProblemLocationDiagramProps {
  problems: Problem[];
}

interface ParsedLocation {
  start: number;
  end?: number;
  problem: Problem;
}

export const ProblemLocationDiagram: React.FC<ProblemLocationDiagramProps> = ({
  problems
}) => {
  // Parse station locations from problem messages/locations
  const parsedLocations = useMemo(() => {
    const locations: ParsedLocation[] = [];
    
    problems.forEach(problem => {
      const text = problem.location || problem.message;
      
      // Match patterns like "Station 0+00 to 1+00" or "Sta. 2+50" or "0+000 - 0+100"
      const rangeMatch = text.match(/(?:Station|Sta\.?)\s*(\d+)\+(\d+)\s*(?:to|-)\s*(?:Station|Sta\.?)?\s*(\d+)\+(\d+)/i);
      const singleMatch = text.match(/(?:Station|Sta\.?)\s*(\d+)\+(\d+)/i);
      
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1]) * 100 + parseInt(rangeMatch[2]);
        const end = parseInt(rangeMatch[3]) * 100 + parseInt(rangeMatch[4]);
        locations.push({ start, end, problem });
      } else if (singleMatch) {
        const start = parseInt(singleMatch[1]) * 100 + parseInt(singleMatch[2]);
        locations.push({ start, problem });
      }
    });
    
    return locations;
  }, [problems]);

  // Calculate diagram bounds
  const bounds = useMemo(() => {
    if (parsedLocations.length === 0) {
      return { min: 0, max: 1000, range: 1000 };
    }
    
    let min = Infinity;
    let max = -Infinity;
    
    parsedLocations.forEach(loc => {
      min = Math.min(min, loc.start);
      max = Math.max(max, loc.end || loc.start);
    });
    
    // Add some padding
    const padding = (max - min) * 0.1 || 100;
    min = Math.max(0, min - padding);
    max = max + padding;
    
    return { min, max, range: max - min };
  }, [parsedLocations]);

  // Group overlapping markers (must be before any early return)
  const groupedMarkers = useMemo(() => {
    if (parsedLocations.length === 0) return [];
    const groups: { x: number; problems: Problem[]; width: number }[] = [];
    parsedLocations.forEach(loc => {
      const xStart = ((loc.start - bounds.min) / bounds.range) * 100;
      const xEnd = loc.end ? ((loc.end - bounds.min) / bounds.range) * 100 : xStart;
      const width = Math.max(xEnd - xStart, 2);
      const existingGroup = groups.find(g =>
        Math.abs(g.x - xStart) < 3 || (xStart >= g.x && xStart <= g.x + g.width)
      );
      if (existingGroup) {
        existingGroup.problems.push(loc.problem);
        existingGroup.width = Math.max(existingGroup.width, width);
      } else {
        groups.push({ x: xStart, problems: [loc.problem], width });
      }
    });
    return groups;
  }, [parsedLocations, bounds]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { fill: '#ef4444', stroke: '#dc2626' };
      case 'warning': return { fill: '#f59e0b', stroke: '#d97706' };
      default: return { fill: '#3b82f6', stroke: '#2563eb' };
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-3 w-3" />;
      case 'warning': return <AlertTriangle className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const formatStation = (value: number) => {
    const major = Math.floor(value / 100);
    const minor = Math.round(value % 100);
    return `${major}+${minor.toString().padStart(2, '0')}`;
  };

  // Generate elevation profile points (simplified terrain line)
  const generateTerrainPath = () => {
    const points: string[] = [];
    const segments = 20;
    const width = 100;
    const baseY = 60;
    const variation = 15;
    
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      // Create a gentle rolling terrain effect
      const y = baseY - Math.sin(i * 0.5) * variation - Math.sin(i * 0.3) * (variation * 0.5);
      points.push(`${x},${y}`);
    }
    
    return `M 0,${baseY} L ${points.join(' L ')}`;
  };

  if (parsedLocations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mb-4 p-4 bg-muted/30 rounded-lg border border-border/50"
    >
      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <span className="inline-block w-3 h-0.5 bg-primary rounded" />
        Problem Locations Along Profile
      </p>
      
      <div className="relative">
        {/* SVG Diagram */}
        <svg
          viewBox="0 0 100 80"
          className="w-full h-24"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-muted-foreground/20" />
            </pattern>
          </defs>
          <rect width="100" height="80" fill="url(#grid)" />
          
          {/* Terrain profile line */}
          <path
            d={generateTerrainPath()}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted-foreground/40"
          />
          
          {/* Design grade line (straighter) */}
          <path
            d="M 0,55 Q 25,52 50,50 T 100,48"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="2,1"
            className="text-primary/60"
          />
          
          {/* Problem markers */}
          <TooltipProvider>
            {groupedMarkers.map((group, idx) => {
              const highestSeverity = group.problems.some(p => p.severity === 'critical') 
                ? 'critical' 
                : group.problems.some(p => p.severity === 'warning') 
                  ? 'warning' 
                  : 'info';
              const colors = getSeverityColor(highestSeverity);
              
              return (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <g className="cursor-pointer">
                      {/* Highlight zone */}
                      <rect
                        x={group.x}
                        y={35}
                        width={Math.max(group.width, 3)}
                        height={30}
                        fill={colors.fill}
                        fillOpacity={0.15}
                        rx={1}
                      />
                      {/* Marker line */}
                      <line
                        x1={group.x + group.width / 2}
                        y1={35}
                        x2={group.x + group.width / 2}
                        y2={65}
                        stroke={colors.stroke}
                        strokeWidth={0.8}
                      />
                      {/* Marker dot */}
                      <circle
                        cx={group.x + group.width / 2}
                        cy={32}
                        r={2.5}
                        fill={colors.fill}
                        stroke={colors.stroke}
                        strokeWidth={0.5}
                      />
                      {/* Count badge if multiple */}
                      {group.problems.length > 1 && (
                        <text
                          x={group.x + group.width / 2}
                          y={33}
                          textAnchor="middle"
                          fontSize={3}
                          fill="white"
                          fontWeight="bold"
                        >
                          {group.problems.length}
                        </text>
                      )}
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      {group.problems.slice(0, 3).map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className={
                            p.severity === 'critical' ? 'text-red-500' :
                            p.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                          }>
                            {getSeverityIcon(p.severity)}
                          </span>
                          <span className="line-clamp-2">{p.message}</span>
                        </div>
                      ))}
                      {group.problems.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{group.problems.length - 3} more issues
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </svg>
        
        {/* Station labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
          <span>{formatStation(bounds.min)}</span>
          <span>{formatStation((bounds.min + bounds.max) / 2)}</span>
          <span>{formatStation(bounds.max)}</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-muted-foreground/40" />
          <span>Existing</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-primary/60 border-dashed border-t border-primary/60" style={{ borderStyle: 'dashed' }} />
          <span>Design</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Warning</span>
        </div>
      </div>
    </motion.div>
  );
};
