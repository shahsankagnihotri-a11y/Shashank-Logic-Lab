import React from 'react';
import { GateType, GATE_CONFIG } from '@/lib/circuit/types';
import { getGateSvgPath, hasInversionCircle } from '@/lib/circuit/shapes';

export const Palette: React.FC = () => {
  const categories = Array.from(new Set(Object.values(GATE_CONFIG).map(c => c.category)));

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('gateType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border overflow-y-auto flex flex-col select-none">
      <div className="p-4 border-b border-sidebar-border font-bold text-sidebar-foreground">
        Components
      </div>
      {categories.map(cat => (
        <div key={cat} className="mb-4">
          <div className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider bg-sidebar-accent/50">
            {cat}
          </div>
          <div className="grid grid-cols-2 gap-2 p-4">
            {Object.entries(GATE_CONFIG).filter(([_, conf]) => conf.category === cat).map(([type, conf]) => {
              const isBasic = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'].includes(type);
              return (
                <div 
                  key={type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, type)}
                  className="flex flex-col items-center justify-center p-3 rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 cursor-grab border border-sidebar-border shadow-sm transition-colors group"
                >
                  <svg width="40" height="40" viewBox="0 0 50 50" className="mb-2">
                    {isBasic ? (
                      <g transform="translate(5, 5)">
                        <path d={getGateSvgPath(type as GateType)} fill="hsl(var(--card))" stroke="hsl(var(--muted-foreground))" strokeWidth="2" className="group-hover:stroke-primary transition-colors" />
                        {hasInversionCircle(type as GateType) && <circle cx={type === 'NOT' || type === 'BUFFER' ? 25 : 35} cy="20" r="4" fill="hsl(var(--background))" stroke="hsl(var(--muted-foreground))" strokeWidth="2" className="group-hover:stroke-primary transition-colors" />}
                      </g>
                    ) : (
                      <g transform="translate(5, 5)">
                        <rect width="40" height="40" fill="hsl(var(--card))" stroke="hsl(var(--muted-foreground))" strokeWidth="2" rx="4" className="group-hover:stroke-primary transition-colors" />
                        <text x="20" y="24" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))" className="font-mono font-bold">{type.split('_')[0]}</text>
                      </g>
                    )}
                  </svg>
                  <span className="text-[10px] font-medium text-sidebar-foreground text-center leading-tight">{conf.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
