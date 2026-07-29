import React from 'react';
import { Wire } from '@/lib/circuit/types';

interface WireNodeProps {
  wire: Wire;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  selected: boolean;
  onSelect: (e: React.MouseEvent, id: string) => void;
}

export const WireNode: React.FC<WireNodeProps> = ({
  wire, fromX, fromY, toX, toY, selected, onSelect
}) => {
  // Simple orthogonal routing
  const midX = (fromX + toX) / 2;
  const path = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
  
  return (
    <g onClick={(e) => onSelect(e, wire.id)}>
      {/* Invisible thicker line for easier clicking */}
      <path 
        d={path} 
        fill="none" 
        stroke="transparent" 
        strokeWidth="15" 
        className="cursor-pointer"
      />
      <path 
        d={path} 
        fill="none" 
        stroke={selected ? "#3b82f6" : wire.state ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} 
        strokeWidth={wire.state ? "3" : "2"}
        className={`transition-colors duration-75 ${wire.state ? 'drop-shadow-[0_0_5px_hsl(var(--primary))]' : ''}`}
      />
    </g>
  );
};
