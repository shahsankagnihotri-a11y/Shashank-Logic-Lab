import React from 'react';
import { Wire, GateType, INPUT_GATE_TYPES, OUTPUT_GATE_TYPES } from '@/lib/circuit/types';

interface WireNodeProps {
  wire: Wire;
  fromX: number; fromY: number;
  toX: number;   toY: number;
  selected: boolean;
  fromGateType?: GateType;
  toGateType?:   GateType;
  onSelect: (e: React.MouseEvent, id: string) => void;
}

/**
 * Wire colour rules (LOW state):
 *   • Amber  (#f59e0b) — originates from an INPUT gate (SWITCH / CLOCK)
 *   • Purple (#a855f7) — terminates at an OUTPUT device (LED / SEVEN_SEG)
 *   • Slate  (#64748b) — all other logic gate connections
 *
 * When HIGH, the wire glows bright green regardless of category.
 * When selected, override with blue.
 */
function resolveWireColor(fromGateType?: GateType, toGateType?: GateType, isHigh = false, selected = false): string {
  if (selected) return '#3b82f6';
  if (isHigh)   return '#22c55e';
  if (fromGateType && INPUT_GATE_TYPES.includes(fromGateType))  return '#f59e0b';
  if (toGateType   && OUTPUT_GATE_TYPES.includes(toGateType))   return '#a855f7';
  return '#64748b';
}

export const WireNode: React.FC<WireNodeProps> = ({
  wire, fromX, fromY, toX, toY,
  fromGateType, toGateType,
  selected, onSelect,
}) => {
  const isHigh   = wire.state === true;
  const filterId = `wire-glow-${wire.id}`;

  const midX        = (fromX + toX) / 2;
  const d           = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  const strokeColor = resolveWireColor(fromGateType, toGateType, isHigh, selected);
  const strokeWidth = isHigh ? 2.5 : selected ? 2 : 1.8;

  // Glow colour matches base category colour when HIGH
  const glowColor =
    isHigh && fromGateType && INPUT_GATE_TYPES.includes(fromGateType)  ? '#f59e0b' :
    isHigh && toGateType   && OUTPUT_GATE_TYPES.includes(toGateType)   ? '#a855f7' :
    '#22c55e';

  return (
    <g>
      {isHigh && (
        <defs>
          <filter id={filterId} x="-20%" y="-100%" width="140%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={glowColor} floodOpacity="0.85" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* Wide invisible click target */}
      <path
        d={d} fill="none" stroke="transparent" strokeWidth="12"
        className="cursor-pointer"
        onClick={(e) => onSelect(e, wire.id)}
      />

      {/* Visible wire */}
      <path
        d={d} fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        filter={isHigh ? `url(#${filterId})` : undefined}
        className="pointer-events-none"
      />

      {/* Category dot at wire midpoint (LOW state only, small visual hint) */}
      {!isHigh && !selected && (
        <circle
          cx={midX} cy={(fromY + toY) / 2}
          r="2.5"
          fill={strokeColor}
          opacity="0.6"
          className="pointer-events-none"
        />
      )}
    </g>
  );
};
