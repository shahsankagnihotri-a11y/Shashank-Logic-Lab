import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Gate, Wire, GateType, GATE_CONFIG, INPUT_GATE_TYPES, OUTPUT_GATE_TYPES } from '@/lib/circuit/types';
import { simulateTick } from '@/lib/circuit/engine';
import { GateNode } from './GateNode';
import { WireNode } from './WireNode';

interface CanvasProps {
  gates: Gate[];
  wires: Wire[];
  setGates: React.Dispatch<React.SetStateAction<Gate[]>>;
  setWires: React.Dispatch<React.SetStateAction<Wire[]>>;
  running: boolean;
  clockHz: number;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

/** Derive a stable wire color based on source gate category (LOW state colors). */
export function wireBaseColor(fromGateType?: GateType, toGateType?: GateType): string {
  if (fromGateType && INPUT_GATE_TYPES.includes(fromGateType))  return '#f59e0b'; // amber  — input source
  if (toGateType   && OUTPUT_GATE_TYPES.includes(toGateType))   return '#a855f7'; // purple — output bound
  return '#64748b'; // slate  — logic gate
}

export const Canvas: React.FC<CanvasProps> = ({
  gates, wires, setGates, setWires, running, clockHz, selectedIds, setSelectedIds
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan]       = useState({ x: 0, y: 0 });
  const [zoom, setZoom]     = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);

  const [draggingGateId, setDraggingGateId]   = useState<string | null>(null);
  const [drawingWire, setDrawingWire]         = useState<{ gateId: string, portId: string, x: number, y: number, isOutput: boolean } | null>(null);
  const [mousePos, setMousePos]               = useState({ x: 0, y: 0 });

  // Clipboard ref (no re-render needed)
  const clipboardRef = useRef<Gate[]>([]);

  // Simulation Loop
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const { gates: ng, wires: nw } = simulateTick(gates, wires, performance.now());
      setGates(ng);
      setWires(nw);
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [running, gates, wires, setGates, setWires]);

  // Convert screen → canvas coords
  const toCanvasCoords = (e: React.MouseEvent | React.WheelEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top  - pan.y) / zoom,
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.shiftKey) {
      setPan(p => ({ x: p.x - e.deltaY, y: p.y }));
    } else if (e.ctrlKey) {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    } else {
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.max(0.15, Math.min(8, zoom * zoomFactor));
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setPan(p => ({
        x: mx - (mx - p.x) * (newZoom / zoom),
        y: my - (my - p.y) * (newZoom / zoom),
      }));
      setZoom(newZoom);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (e.button === 0) {
      if (!e.shiftKey) setSelectedIds([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = toCanvasCoords(e);
    setMousePos(coords);

    if (isPanning && dragStart) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggingGateId) {
      const nx = Math.round(coords.x / 20) * 20;
      const ny = Math.round(coords.y / 20) * 20;
      setGates(gs => gs.map(g => g.id === draggingGateId ? { ...g, x: nx - 20, y: ny - 20 } : g));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingGateId(null);
    setDrawingWire(null);
  };

  const handleGateMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (!selectedIds.includes(id)) {
      setSelectedIds(e.shiftKey ? [...selectedIds, id] : [id]);
    }
    setDraggingGateId(id);
  };

  const handleGateSelect    = (e: React.MouseEvent) => { e.stopPropagation(); };
  const handleGateDoubleClick = (id: string) => {
    const label = prompt('Gate label:');
    if (label !== null) setGates(gs => gs.map(g => g.id === id ? { ...g, label } : g));
  };

  const handleToggleSwitch = (id: string) => {
    setGates(gs => gs.map(g => g.id === id && g.type === 'SWITCH' ? { ...g, state: { ...g.state, isOn: !g.state.isOn } } : g));
  };

  const handlePortMouseDown = (e: React.MouseEvent, gateId: string, portId: string, isOutput: boolean) => {
    e.stopPropagation();
    const coords = toCanvasCoords(e);
    setDrawingWire({ gateId, portId, x: coords.x, y: coords.y, isOutput });
  };

  const handlePortMouseUp = (e: React.MouseEvent, gateId: string, portId: string, isOutput: boolean) => {
    e.stopPropagation();
    if (drawingWire && drawingWire.gateId !== gateId && drawingWire.isOutput !== isOutput) {
      const fromGate = drawingWire.isOutput ? drawingWire.gateId : gateId;
      const fromPort = drawingWire.isOutput ? drawingWire.portId : portId;
      const toGate   = drawingWire.isOutput ? gateId : drawingWire.gateId;
      const toPort   = drawingWire.isOutput ? portId  : drawingWire.portId;

      if (wires.some(w => w.toGateId === toGate && w.toPort === toPort)) return;

      setWires(ws => [...ws, {
        id: `wire-${Math.random().toString(36).substr(2, 9)}`,
        fromGateId: fromGate, fromPort,
        toGateId:   toGate,   toPort,
        state: false,
      }]);
    }
    setDrawingWire(null);
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return; // don't steal from inputs

    const ctrl = e.ctrlKey || e.metaKey;

    // Delete / Backspace — remove selected
    if ((e.key === 'Delete' || e.key === 'Backspace') && !ctrl) {
      setGates(gs => gs.filter(g => !selectedIds.includes(g.id)));
      setWires(ws => ws.filter(w =>
        !selectedIds.includes(w.id) &&
        !selectedIds.includes(w.fromGateId) &&
        !selectedIds.includes(w.toGateId)
      ));
      setSelectedIds([]);
      return;
    }

    // Ctrl+A — select all
    if (ctrl && e.key === 'a') {
      e.preventDefault();
      setGates(gs => { setSelectedIds(gs.map(g => g.id)); return gs; });
      return;
    }

    // Ctrl+C — copy selected gates
    if (ctrl && e.key === 'c') {
      e.preventDefault();
      setGates(gs => {
        clipboardRef.current = gs.filter(g => selectedIds.includes(g.id));
        return gs;
      });
      return;
    }

    // Ctrl+X — cut selected gates
    if (ctrl && e.key === 'x') {
      e.preventDefault();
      setGates(gs => {
        clipboardRef.current = gs.filter(g => selectedIds.includes(g.id));
        const remaining = gs.filter(g => !selectedIds.includes(g.id));
        setWires(ws => ws.filter(w =>
          !selectedIds.includes(w.fromGateId) && !selectedIds.includes(w.toGateId)
        ));
        setSelectedIds([]);
        return remaining;
      });
      return;
    }

    // Ctrl+V — paste
    if (ctrl && e.key === 'v') {
      e.preventDefault();
      const clipboard = clipboardRef.current;
      if (!clipboard.length) return;
      const OFFSET = 40;
      const idMap: Record<string, string> = {};
      const newGates: Gate[] = clipboard.map(g => {
        const newId = `gate-${Math.random().toString(36).substr(2, 9)}`;
        idMap[g.id] = newId;
        return { ...g, id: newId, x: g.x + OFFSET, y: g.y + OFFSET };
      });
      setGates(gs => [...gs, ...newGates]);
      setSelectedIds(newGates.map(g => g.id));
      return;
    }

    // Escape — deselect all
    if (e.key === 'Escape') {
      setSelectedIds([]);
    }
  }, [selectedIds, setGates, setWires, setSelectedIds]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Drop from Palette ─────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('gateType') as GateType;
    if (type && GATE_CONFIG[type]) {
      const coords = toCanvasCoords(e as unknown as React.MouseEvent);
      const conf   = GATE_CONFIG[type];
      const newGate: Gate = {
        id: `gate-${Math.random().toString(36).substr(2, 9)}`,
        type,
        x: Math.round(coords.x / 20) * 20,
        y: Math.round(coords.y / 20) * 20,
        inputCount: conf.defaultInputs,
        inputs:  new Array(conf.defaultInputs).fill(false),
        outputs: new Array(conf.outputs).fill(false),
        state: type === 'CLOCK' ? { frequency: clockHz } : {},
        scale: 1,
      };
      setGates(gs => [...gs, newGate]);
    }
  };

  // ── Port coordinate helpers (scale-aware) ─────────────────────────────────
  const getPortCoords = (gateId: string, portId: string, isOutput: boolean) => {
    const g = gates.find(g => g.id === gateId);
    if (!g) return { x: 0, y: 0 };

    const s       = g.scale ?? 1;
    const width   = 40;
    const height  = Math.max(40, g.inputCount * 15);
    const isBasic = ['AND','OR','NOT','NAND','NOR','XOR','XNOR','BUFFER'].includes(g.type);
    const hasCircle = ['NAND','NOR','XNOR','NOT'].includes(g.type);

    if (isOutput) {
      const match = portId.match(/out-(\d+)/);
      const idx   = match ? parseInt(match[1]) : 0;
      const y     = g.outputs.length === 1 ? height / 2 : 10 + (idx * (height - 20) / Math.max(1, g.outputs.length - 1));
      const ox    = isBasic ? (hasCircle ? 39 : 35) : width;
      return { x: g.x + (ox + 10) * s, y: g.y + y * s };
    } else {
      const match = portId.match(/in-(\d+)/);
      const idx   = match ? parseInt(match[1]) : 0;
      const y     = g.inputCount === 1 ? height / 2 : 10 + (idx * (height - 20) / Math.max(1, g.inputCount - 1));
      return { x: g.x + (-10) * s, y: g.y + y * s };
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-background canvas-grid outline-none select-none relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      tabIndex={0}
    >
      <svg className="w-full h-full pointer-events-none">
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} className="pointer-events-auto">

          {/* Wires */}
          {wires.map(w => {
            const fromC      = getPortCoords(w.fromGateId, w.fromPort, true);
            const toC        = getPortCoords(w.toGateId,   w.toPort,   false);
            const fromGate   = gates.find(g => g.id === w.fromGateId);
            const toGate     = gates.find(g => g.id === w.toGateId);
            return (
              <WireNode
                key={w.id}
                wire={w}
                fromX={fromC.x} fromY={fromC.y}
                toX={toC.x}     toY={toC.y}
                fromGateType={fromGate?.type}
                toGateType={toGate?.type}
                selected={selectedIds.includes(w.id)}
                onSelect={(e, id) => {
                  e.stopPropagation();
                  setSelectedIds(e.shiftKey ? [...selectedIds, id] : [id]);
                }}
              />
            );
          })}

          {/* Temporary wire while dragging */}
          {drawingWire && (() => {
            const anchor = getPortCoords(drawingWire.gateId, drawingWire.portId, drawingWire.isOutput);
            const x1 = drawingWire.isOutput ? anchor.x : mousePos.x;
            const y1 = drawingWire.isOutput ? anchor.y : mousePos.y;
            const x2 = drawingWire.isOutput ? mousePos.x : anchor.x;
            const y2 = drawingWire.isOutput ? mousePos.y : anchor.y;
            const mx = (x1 + x2) / 2;
            return (
              <path
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5"
              />
            );
          })()}

          {/* Gates */}
          {gates.map(g => (
            <GateNode
              key={g.id}
              gate={g}
              selected={selectedIds.includes(g.id)}
              onSelect={handleGateSelect}
              onMouseDown={handleGateMouseDown}
              onPortMouseDown={handlePortMouseDown}
              onPortMouseUp={handlePortMouseUp}
              onDoubleClick={handleGateDoubleClick}
              onToggleSwitch={handleToggleSwitch}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
