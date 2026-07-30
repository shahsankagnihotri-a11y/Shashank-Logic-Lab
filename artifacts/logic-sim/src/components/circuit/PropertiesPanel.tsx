import React from 'react';
import { Gate, Wire } from '@/lib/circuit/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TruthTable } from '@/components/circuit/TruthTable';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface PropertiesPanelProps {
  selectedIds: string[];
  gates: Gate[];
  setGates: React.Dispatch<React.SetStateAction<Gate[]>>;
  wires: Wire[];
}

const SCALE_STEP = 0.25;
const SCALE_MIN  = 0.5;
const SCALE_MAX  = 3;

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedIds, gates, setGates, wires,
}) => {
  if (selectedIds.length === 0) {
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4 text-sm text-primary/40 text-center flex flex-col justify-center gap-3 mono tracking-wide z-10 relative shadow-[-4px_0_20px_rgba(0,0,0,0.3)]">
        <div>AWAITING SELECTION...</div>
        <div className="text-[10px] text-primary/30 leading-relaxed">
          Click a gate or wire<br/>to inspect its properties
        </div>
      </div>
    );
  }

  if (selectedIds.length > 1) {
    // Multi-select: show bulk scale controls
    const changeScaleAll = (delta: number) => {
      setGates(gs => gs.map(g =>
        selectedIds.includes(g.id)
          ? { ...g, scale: Math.max(SCALE_MIN, Math.min(SCALE_MAX, Math.round(((g.scale ?? 1) + delta) * 100) / 100)) }
          : g
      ));
    };
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4 z-10 relative shadow-[-4px_0_20px_rgba(0,0,0,0.3)] space-y-5">
        <h3 className="font-bold text-primary pb-2 border-b border-primary/30 neon-text mono uppercase text-sm tracking-wider">
          Multi-Select
        </h3>
        <div>
          <span className="font-bold text-primary">{selectedIds.length}</span>
          <span className="text-sm text-muted-foreground"> nodes selected</span>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">Resize All</Label>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => changeScaleAll(-SCALE_STEP)}>
              <ZoomOut className="w-3.5 h-3.5" /> Smaller
            </Button>
            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => changeScaleAll(+SCALE_STEP)}>
              <ZoomIn className="w-3.5 h-3.5" /> Larger
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const id   = selectedIds[0];
  const gate = gates.find(g => g.id === id);
  const wire = wires.find(w => w.id === id);

  // ── Wire inspector ────────────────────────────────────────────────────────
  if (wire) {
    return (
      <div className="w-64 h-full bg-sidebar border-l border-sidebar-border p-4 z-10 relative shadow-[-4px_0_20px_rgba(0,0,0,0.3)]">
        <h3 className="font-bold text-primary mb-4 pb-2 border-b border-primary/30 neon-text mono uppercase text-sm tracking-wider">Wire Inspector</h3>
        <div className="space-y-5">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">Signal State</Label>
            <div className={`mt-1 font-mono font-bold text-lg ${wire.state ? 'text-primary neon-text' : 'text-muted-foreground'}`}>
              {wire.state ? 'HIGH (1)' : 'LOW (0)'}
            </div>
          </div>

          {/* Wire colour legend */}
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">Wire Colour Guide</Label>
            <div className="mt-2 space-y-1.5 text-xs mono">
              {[
                { color: '#f59e0b', label: 'Amber  — from Switch / Clock' },
                { color: '#64748b', label: 'Slate  — logic gate' },
                { color: '#a855f7', label: 'Purple — to LED / 7-Seg' },
                { color: '#22c55e', label: 'Green  — HIGH signal (any)' },
              ].map(({ color, label }) => (
                <div key={color} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
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

  // ── Gate inspector ────────────────────────────────────────────────────────
  if (gate) {
    const isConfigurable = ['AND','OR','NAND','NOR','XOR','XNOR'].includes(gate.type);
    const currentScale   = gate.scale ?? 1;

    const changeScale = (delta: number) => {
      const next = Math.max(SCALE_MIN, Math.min(SCALE_MAX, Math.round((currentScale + delta) * 100) / 100));
      setGates(gs => gs.map(g => g.id === gate.id ? { ...g, scale: next } : g));
    };

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

          {/* ── Size control ── */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">
              Size — {Math.round(currentScale * 100)}%
            </Label>
            <div className="flex items-center gap-2">
              <Button
                size="icon" variant="outline"
                className="h-8 w-8 shrink-0"
                disabled={currentScale <= SCALE_MIN}
                onClick={() => changeScale(-SCALE_STEP)}
                title="Decrease size"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>

              {/* Visual scale bar */}
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${((currentScale - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100}%` }}
                />
              </div>

              <Button
                size="icon" variant="outline"
                className="h-8 w-8 shrink-0"
                disabled={currentScale >= SCALE_MAX}
                onClick={() => changeScale(+SCALE_STEP)}
                title="Increase size"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex justify-between text-[9px] text-primary/40 mono px-0.5">
              <span>50%</span>
              <span>100%</span>
              <span>300%</span>
            </div>
          </div>

          {isConfigurable && (
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-primary/60 mono font-bold">Input Channels</Label>
              <Input
                type="number" min={2} max={8}
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
                type="number" min={1} max={100}
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
