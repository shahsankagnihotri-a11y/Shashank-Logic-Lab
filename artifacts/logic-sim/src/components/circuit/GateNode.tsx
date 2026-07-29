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

export const GateNode: React.FC<GateNodeProps> = ({
  gate, selected, onSelect, onMouseDown, onPortMouseDown, onPortMouseUp, onDoubleClick, onToggleSwitch
}) => {
  const width = 40;
  const height = Math.max(40, gate.inputCount * 15);
  
  // Calculate port positions
  const inPorts = Array.from({ length: gate.inputCount }).map((_, i) => ({
    id: `in-${i}`,
    y: gate.inputCount === 1 ? height / 2 : 10 + (i * (height - 20) / Math.max(1, gate.inputCount - 1))
  }));
  
  const outPorts = Array.from({ length: gate.outputs.length }).map((_, i) => ({
    id: `out-${i}`,
    y: gate.outputs.length === 1 ? height / 2 : 10 + (i * (height - 20) / Math.max(1, gate.outputs.length - 1))
  }));

  const isBasic = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'].includes(gate.type);
  
  return (
    <g 
      transform={`translate(${gate.x}, ${gate.y})`} 
      onMouseDown={(e) => onMouseDown(e, gate.id)}
      onClick={(e) => onSelect(e, gate.id)}
      onDoubleClick={() => onDoubleClick(gate.id)}
      className="cursor-move"
    >
      {/* Selection outline */}
      {selected && (
        <rect x="-5" y="-5" width={width + 10} height={height + 10} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" rx="4" />
      )}

      {/* Body */}
      {isBasic ? (
        <g>
          <path 
            d={getGateSvgPath(gate.type)} 
            fill="hsl(var(--card))" 
            stroke={selected ? "#3b82f6" : "hsl(var(--muted-foreground))"} 
            strokeWidth="2" 
          />
          {hasInversionCircle(gate.type) && (
             <circle cx={gate.type === 'NOT' || gate.type === 'BUFFER' ? 25 : 35} cy="20" r="4" fill="hsl(var(--background))" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
          )}
        </g>
      ) : (
        <rect 
          x="0" y="0" 
          width={width} height={height} 
          fill="hsl(var(--card))" 
          stroke={selected ? "#3b82f6" : "hsl(var(--muted-foreground))"} 
          strokeWidth="2" 
          rx="4"
        />
      )}

      {/* Gate specific interior */}
      {!isBasic && (
        <text x={width/2} y={height/2 + 4} textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))" className="pointer-events-none font-mono font-bold">
          {gate.type === 'SWITCH' ? (gate.state?.isOn ? '1' : '0') :
           gate.type === 'LED' ? '' :
           gate.type === 'CLOCK' ? 'CLK' :
           gate.type.replace('_FF', '').replace('_LATCH', '')}
        </text>
      )}

      {gate.type === 'LED' && (
        <circle cx={width/2} cy={height/2} r="10" fill={gate.state?.isOn ? "hsl(var(--primary))" : "hsl(var(--muted))"} />
      )}
      
      {gate.type === 'SEVEN_SEG' && (
        <text x={width/2} y={height/2 + 6} textAnchor="middle" fontSize="20" fill="hsl(var(--primary))" className="pointer-events-none font-mono font-bold">
          {((gate.state?.value || 0) as number).toString(16).toUpperCase()}
        </text>
      )}

      {/* Label */}
      {gate.label && (
        <text x={width/2} y="-10" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))" className="pointer-events-none">
          {gate.label}
        </text>
      )}

      {/* Switch interaction overlay */}
      {gate.type === 'SWITCH' && (
        <rect x="0" y="0" width={width} height={height} fill="transparent" cursor="pointer" onClick={(e) => {
          e.stopPropagation();
          onToggleSwitch?.(gate.id);
        }} />
      )}

      {/* Input Ports */}
      {inPorts.map(p => (
        <g key={p.id} transform={`translate(0, ${p.y})`}>
          <line x1="-10" y1="0" x2="0" y2="0" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
          <circle 
            cx="-10" cy="0" r="5" 
            fill="hsl(var(--background))" 
            stroke="hsl(var(--muted-foreground))" 
            strokeWidth="2"
            className="cursor-crosshair hover:stroke-primary hover:fill-primary"
            onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, gate.id, p.id, false); }}
            onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp(e, gate.id, p.id, false); }}
          />
        </g>
      ))}

      {/* Output Ports */}
      {outPorts.map((p, i) => (
        <g key={p.id} transform={`translate(${isBasic ? (hasInversionCircle(gate.type) ? 39 : 35) : width}, ${p.y})`}>
          <line x1="0" y1="0" x2="10" y2="0" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
          <circle 
            cx="10" cy="0" r="5" 
            fill={gate.outputs[i] ? "hsl(var(--primary))" : "hsl(var(--background))"} 
            stroke={gate.outputs[i] ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} 
            strokeWidth="2"
            className="cursor-crosshair hover:stroke-primary"
            onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, gate.id, p.id, true); }}
            onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp(e, gate.id, p.id, true); }}
          />
        </g>
      ))}
    </g>
  );
};
