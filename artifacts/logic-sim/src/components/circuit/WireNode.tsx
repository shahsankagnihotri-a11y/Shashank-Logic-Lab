import React from 'react';
import { Wire } from '@/lib/circuit/types';

interface WireNodeProps {
  wire: Wire;
  fromX: number; fromY: number;
  toX: number; toY: number;
  selected: boolean;
  onSelect: (e: React.MouseEvent, id: string) => void;
}

export const WireNode: React.FC<WireNodeProps> = ({
  wire, fromX, fromY, toX, toY, selected, onSelect
}) => {
  const isHigh = wire.state === true;
  const filterId = `wire-glow-${wire.id}`;

  // Orthogonal path: go horizontal midpoint then vertical
  const midX = (fromX + toX) / 2;
  const d = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

  const strokeColor =
    selected   ? '#3b82f6' :
    isHigh     ? '#22c55e' :
    'hsl(var(--muted-foreground))';

  const strokeWidth = isHigh ? 2.5 : selected ? 2 : 1.8;

  return (
    <g>
      {isHigh && (
        <defs>
          <filter id={filterId} x="-20%" y="-100%" width="140%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#22c55e" floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* Click-target (wide invisible line) */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth="12"
        className="cursor-pointer"
        onClick={(e) => onSelect(e, wire.id)}
      />

      {/* Visible wire */}
      <path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        filter={isHigh ? `url(#${filterId})` : undefined}
        className="pointer-events-none"
      />
    </g>
  );
};
