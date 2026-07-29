import React from 'react';
import { Gate, Wire } from '@/lib/circuit/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PropertiesPanelProps {
  selectedIds: string[];
  gates: Gate[];
  setGates: React.Dispatch<React.SetStateAction<Gate[]>>;
  wires: Wire[];
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedIds, gates, setGates, wires }) => {
  if (selectedIds.length === 0) {
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4 text-sm text-sidebar-foreground/50 text-center flex flex-col justify-center">
        Select a component to view properties.
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4 text-sm text-sidebar-foreground/80">
        {selectedIds.length} items selected.
      </div>
    );
  }

  const id = selectedIds[0];
  const gate = gates.find(g => g.id === id);
  const wire = wires.find(w => w.id === id);

  if (wire) {
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4">
        <h3 className="font-bold text-sidebar-foreground mb-4 pb-2 border-b border-sidebar-border">Wire Properties</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">State</Label>
            <div className={`mt-1 font-mono font-bold ${wire.state ? 'text-primary' : 'text-muted-foreground'}`}>
              {wire.state ? 'HIGH (1)' : 'LOW (0)'}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Source</Label>
            <div className="mt-1 text-sm">{wire.fromGateId} ({wire.fromPort})</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Target</Label>
            <div className="mt-1 text-sm">{wire.toGateId} ({wire.toPort})</div>
          </div>
        </div>
      </div>
    );
  }

  if (gate) {
    const isConfigurable = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'].includes(gate.type);
    
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4">
        <h3 className="font-bold text-sidebar-foreground mb-4 pb-2 border-b border-sidebar-border">Gate Properties</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <div className="mt-1 font-mono font-bold">{gate.type}</div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input 
              value={gate.label || ''} 
              onChange={e => setGates(gs => gs.map(g => g.id === gate.id ? { ...g, label: e.target.value } : g))}
              placeholder="e.g. Carry Out"
              className="h-8"
            />
          </div>

          {isConfigurable && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Input Count (2-8)</Label>
              <Input 
                type="number"
                min={2} max={8}
                value={gate.inputCount} 
                onChange={e => {
                  const c = Math.max(2, Math.min(8, parseInt(e.target.value) || 2));
                  setGates(gs => gs.map(g => g.id === gate.id ? { ...g, inputCount: c, inputs: new Array(c).fill(false) } : g));
                }}
                className="h-8"
              />
            </div>
          )}

          {gate.type === 'CLOCK' && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Frequency (Hz)</Label>
              <Input 
                type="number"
                min={1} max={100}
                value={gate.state?.frequency || 1} 
                onChange={e => {
                  const f = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                  setGates(gs => gs.map(g => g.id === gate.id ? { ...g, state: { ...g.state, frequency: f } } : g));
                }}
                className="h-8"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
