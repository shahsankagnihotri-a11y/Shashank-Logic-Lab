import React from 'react';
import { Gate, Wire } from '@/lib/circuit/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TruthTable } from '@/components/circuit/TruthTable';

interface PropertiesPanelProps {
  selectedIds: string[];
  gates: Gate[];
  setGates: React.Dispatch<React.SetStateAction<Gate[]>>;
  wires: Wire[];
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedIds, gates, setGates, wires }) => {
  if (selectedIds.length === 0) {
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4 text-sm text-primary/40 text-center flex flex-col justify-center mono tracking-wide z-10 relative shadow-[-4px_0_20px_rgba(0,0,0,0.3)]">
        AWAITING SELECTION...
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4 text-sm text-primary/80 mono z-10 relative shadow-[-4px_0_20px_rgba(0,0,0,0.3)]">
        <span className="font-bold text-primary">{selectedIds.length}</span> NODES SELECTED
      </div>
    );
  }

  const id = selectedIds[0];
  const gate = gates.find(g => g.id === id);
  const wire = wires.find(w => w.id === id);

  if (wire) {
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4 z-10 relative shadow-[-4px_0_20px_rgba(0,0,0,0.3)]">
        <h3 className="font-bold text-primary mb-4 pb-2 border-b border-primary/30 neon-text mono uppercase text-sm tracking-wider">Wire Inspector</h3>
        <div className="space-y-5">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">State</Label>
            <div className={`mt-1 font-mono font-bold text-lg ${wire.state ? 'text-primary neon-text' : 'text-muted-foreground'}`}>
              {wire.state ? 'HIGH (1)' : 'LOW (0)'}
            </div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">Source Node</Label>
            <div className="mt-1 text-xs mono text-foreground/80 bg-background/50 px-2 py-1.5 rounded border border-border">{wire.fromGateId} ({wire.fromPort})</div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">Target Node</Label>
            <div className="mt-1 text-xs mono text-foreground/80 bg-background/50 px-2 py-1.5 rounded border border-border">{wire.toGateId} ({wire.toPort})</div>
          </div>
        </div>
      </div>
    );
  }

  if (gate) {
    const isConfigurable = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'].includes(gate.type);
    
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4 overflow-y-auto scrollbar-none z-10 relative shadow-[-4px_0_20px_rgba(0,0,0,0.3)]">
        <h3 className="font-bold text-primary mb-4 pb-2 border-b border-primary/30 neon-text mono uppercase text-sm tracking-wider">Node Inspector</h3>
        <div className="space-y-5">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">Type</Label>
            <div className="mt-1 font-mono font-bold text-lg text-foreground">{gate.type}</div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">Label</Label>
            <Input 
              value={gate.label || ''} 
              onChange={e => setGates(gs => gs.map(g => g.id === gate.id ? { ...g, label: e.target.value } : g))}
              placeholder="e.g. Carry Out"
              className="h-8 mono text-xs bg-background/50 border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>

          {isConfigurable && (
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">Input Channels</Label>
              <Input 
                type="number"
                min={2} max={8}
                value={gate.inputCount} 
                onChange={e => {
                  const c = Math.max(2, Math.min(8, parseInt(e.target.value) || 2));
                  setGates(gs => gs.map(g => g.id === gate.id ? { ...g, inputCount: c, inputs: new Array(c).fill(false) } : g));
                }}
                className="h-8 mono text-xs bg-background/50 border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>
          )}

          {gate.type === 'CLOCK' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">Frequency (Hz)</Label>
              <Input 
                type="number"
                min={1} max={100}
                value={gate.state?.frequency || 1} 
                onChange={e => {
                  const f = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                  setGates(gs => gs.map(g => g.id === gate.id ? { ...g, state: { ...g.state, frequency: f } } : g));
                }}
                className="h-8 mono text-xs bg-background/50 border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>
          )}

          <TruthTable type={gate.type} inputCount={gate.inputCount || 2} />
        </div>
      </div>
    );
  }

  return null;
};
