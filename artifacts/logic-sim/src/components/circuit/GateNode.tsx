import React from 'react';
import { Gate, GateType } from '@/lib/circuit/types';
import { getGateSvgPath, hasInversionCircle } from '@/lib/circuit/shapes';

interface GateNodeProps {
  gate: Gate;
  selected: boolean;
  onSelect: (e: React.MouseEvent, id: string) => void;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onPortMouseDown: (e: React.MouseEvent, gateId: string, portId: string, isOutput: boolean) => void;
  onPortMouseUp: (e: React.MouseEvent, gateId: string, portId: string, isOutput: boolean) => void;
  onDoubleClick: (id: string) => void;
  onToggleSwitch?: (id: string) => void;
}

const GLOW_GREEN  = '#22c55e';
const GLOW_AMBER  = '#f59e0b';
const GLOW_BLUE   = '#3b82f6';

export const GateNode: React.FC<GateNodeProps> = ({
  gate, selected, onSelect, onMouseDown, onPortMouseDown, onPortMouseUp, onDoubleClick, onToggleSwitch
}) => {
  const width = 40;
  const height = Math.max(40, gate.inputCount * 15);

  const isOn    = !!gate.state?.isOn;
  const isHigh  = gate.outputs[0] === true;
  const isClock = gate.type === 'CLOCK';
  const isLED   = gate.type === 'LED';
  const isSwitch = gate.type === 'SWITCH';

  // Glow colours
  const glowColor =
    isClock && isHigh ? GLOW_AMBER :
    (isHigh || isOn)  ? GLOW_GREEN :
    undefined;

  const filterId = `glow-${gate.id}`;
  const hasGlow  = !!glowColor;

  const inPorts = Array.from({ length: gate.inputCount }).map((_, i) => ({
    id: `in-${i}`,
    y: gate.inputCount === 1 ? height / 2 : 10 + (i * (height - 20) / Math.max(1, gate.inputCount - 1)),
    active: gate.inputs[i] === true,
  }));

  const outPorts = Array.from({ length: gate.outputs.length }).map((_, i) => ({
    id: `out-${i}`,
    y: gate.outputs.length === 1 ? height / 2 : 10 + (i * (height - 20) / Math.max(1, gate.outputs.length - 1)),
    active: gate.outputs[i] === true,
  }));

  const isBasic = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'].includes(gate.type);

  const bodyStroke =
    selected ? GLOW_BLUE :
    hasGlow  ? glowColor! :
    'hsl(var(--muted-foreground))';

  const bodyFill =
    isSwitch && isOn  ? 'rgba(34,197,94,0.18)' :
    isClock   && isHigh ? 'rgba(245,158,11,0.15)' :
    isHigh              ? 'rgba(34,197,94,0.10)' :
    'hsl(var(--card))';

  return (
    <g
      transform={`translate(${gate.x}, ${gate.y})`}
      onMouseDown={(e) => onMouseDown(e, gate.id)}
      onClick={(e) => onSelect(e, gate.id)}
      onDoubleClick={() => onDoubleClick(gate.id)}
      className="cursor-move"
    >
      {/* SVG filter for glow */}
      {hasGlow && (
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor={glowColor} floodOpacity="0.9" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* Selection outline */}
      {selected && (
        <rect
          x="-6" y="-6" width={width + 12} height={height + 12}
          fill="none" stroke={GLOW_BLUE} strokeWidth="1.5" strokeDasharray="4" rx="5"
        />
      )}

      {/* Body */}
      {isBasic ? (
        <g filter={hasGlow ? `url(#${filterId})` : undefined}>
          <path
            d={getGateSvgPath(gate.type)}
            fill={bodyFill}
            stroke={bodyStroke}
            strokeWidth={hasGlow ? 2.5 : 2}
          />
          {hasInversionCircle(gate.type) && (
            <circle
              cx={gate.type === 'NOT' || gate.type === 'BUFFER' ? 25 : 35}
              cy="20" r="4"
              fill="hsl(var(--background))"
              stroke={bodyStroke}
              strokeWidth="2"
            />
          )}
        </g>
      ) : (
        <rect
          x="0" y="0" width={width} height={height}
          fill={bodyFill}
          stroke={bodyStroke}
          strokeWidth={hasGlow ? 2.5 : 2}
          rx="4"
          filter={hasGlow ? `url(#${filterId})` : undefined}
        />
      )}

      {/* Gate label inside */}
      {!isBasic && (
        <text
          x={width / 2} y={height / 2 + 4}
          textAnchor="middle" fontSize="10"
          fill={hasGlow ? glowColor : 'hsl(var(--foreground))'}
          className="pointer-events-none font-mono font-bold"
        >
          {isSwitch ? (isOn ? '1' : '0') :
           isLED    ? '' :
           isClock  ? 'CLK' :
           gate.type.replace('_FF', '').replace('_LATCH', '')}
        </text>
      )}

      {/* LED bulb */}
      {isLED && (
        <>
          <circle
            cx={width / 2} cy={height / 2} r="12"
            fill={gate.state?.isOn ? GLOW_GREEN : 'hsl(var(--muted))'}
            filter={gate.state?.isOn ? `url(#${filterId})` : undefined}
          />
          {/* LED lens shine */}
          {gate.state?.isOn && (
            <ellipse cx={width / 2 - 3} cy={height / 2 - 4} rx="3" ry="2"
              fill="rgba(255,255,255,0.5)" />
          )}
        </>
      )}

      {/* 7-Segment display */}
      {gate.type === 'SEVEN_SEG' && (
        <text
          x={width / 2} y={height / 2 + 6}
          textAnchor="middle" fontSize="20"
          fill={GLOW_GREEN}
          className="pointer-events-none font-mono font-bold"
          filter={hasGlow ? `url(#${filterId})` : undefined}
        >
          {((gate.state?.value || 0) as number).toString(16).toUpperCase()}
        </text>
      )}

      {/* SWITCH indicator strip */}
      {isSwitch && (
        <rect
          x="4" y={height - 8} width={width - 8} height="4"
          rx="2"
          fill={isOn ? GLOW_GREEN : 'hsl(var(--muted-foreground))'}
          filter={isOn ? `url(#${filterId})` : undefined}
        />
      )}

      {/* External label */}
      {gate.label && (
        <text
          x={width / 2} y="-10"
          textAnchor="middle" fontSize="12"
          fill="hsl(var(--foreground))"
          className="pointer-events-none"
        >
          {gate.label}
        </text>
      )}

      {/* Switch click overlay */}
      {isSwitch && (
        <rect
          x="0" y="0" width={width} height={height}
          fill="transparent" cursor="pointer"
          onClick={(e) => { e.stopPropagation(); onToggleSwitch?.(gate.id); }}
        />
      )}

      {/* Input Ports */}
      {inPorts.map(p => (
        <g key={p.id} transform={`translate(0, ${p.y})`}>
          <line
            x1="-10" y1="0" x2="0" y2="0"
            stroke={p.active ? GLOW_GREEN : 'hsl(var(--muted-foreground))'}
            strokeWidth={p.active ? 2.5 : 2}
          />
          <circle
            cx="-10" cy="0" r="5"
            fill={p.active ? GLOW_GREEN : 'hsl(var(--background))'}
            stroke={p.active ? GLOW_GREEN : 'hsl(var(--muted-foreground))'}
            strokeWidth="2"
            className="cursor-crosshair hover:stroke-primary hover:fill-primary"
            onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, gate.id, p.id, false); }}
            onMouseUp={(e)   => { e.stopPropagation(); onPortMouseUp(e, gate.id, p.id, false); }}
          />
        </g>
      ))}

      {/* Output Ports */}
      {outPorts.map((p, i) => {
        const ox = isBasic ? (hasInversionCircle(gate.type) ? 39 : 35) : width;
        return (
          <g key={p.id} transform={`translate(${ox}, ${p.y})`}>
            <line
              x1="0" y1="0" x2="10" y2="0"
              stroke={p.active ? GLOW_GREEN : 'hsl(var(--muted-foreground))'}
              strokeWidth={p.active ? 2.5 : 2}
            />
            <circle
              cx="10" cy="0" r="5"
              fill={p.active ? GLOW_GREEN : 'hsl(var(--background))'}
              stroke={p.active ? GLOW_GREEN : 'hsl(var(--muted-foreground))'}
              strokeWidth="2"
              className="cursor-crosshair hover:stroke-primary"
              onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, gate.id, p.id, true); }}
              onMouseUp={(e)   => { e.stopPropagation(); onPortMouseUp(e, gate.id, p.id, true); }}
            />
          </g>
        );
      })}
    </g>
  );
};
