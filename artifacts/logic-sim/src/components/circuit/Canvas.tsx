import React, { useRef, useState, useEffect } from 'react';
import { Gate, Wire, GateType, GATE_CONFIG } from '@/lib/circuit/types';
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

export const Canvas: React.FC<CanvasProps> = ({
  gates, wires, setGates, setWires, running, clockHz, selectedIds, setSelectedIds
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  
  const [draggingGateId, setDraggingGateId] = useState<string | null>(null);
  const [drawingWire, setDrawingWire] = useState<{ gateId: string, portId: string, x: number, y: number, isOutput: boolean } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Simulation Loop
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const { gates: newGates, wires: newWires } = simulateTick(gates, wires, performance.now());
      // Only update if things changed to save renders (rough check)
      setGates(newGates);
      setWires(newWires);
    }, 1000 / 60); // 60Hz logic loop
    return () => clearInterval(interval);
  }, [running, gates, wires, setGates, setWires]);

  // Convert screen to canvas coords
  const toCanvasCoords = (e: React.MouseEvent | React.WheelEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.shiftKey) {
      // Shift+scroll = horizontal pan
      setPan(p => ({ x: p.x - e.deltaY, y: p.y }));
    } else if (e.ctrlKey) {
      // Ctrl+scroll = pan vertically
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    } else {
      // Plain scroll = zoom centred on mouse cursor
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.max(0.15, Math.min(8, zoom * zoomFactor));
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      // Adjust pan so the point under the cursor stays fixed
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
      // snap to 20px grid
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

  const handleGateSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
  };

  const handleGateDoubleClick = (id: string) => {
    const label = prompt("Gate label:");
    if (label !== null) {
      setGates(gs => gs.map(g => g.id === id ? { ...g, label } : g));
    }
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
      // Connect!
      const fromGate = drawingWire.isOutput ? drawingWire.gateId : gateId;
      const fromPort = drawingWire.isOutput ? drawingWire.portId : portId;
      const toGate = drawingWire.isOutput ? gateId : drawingWire.gateId;
      const toPort = drawingWire.isOutput ? portId : drawingWire.portId;

      // Check if toPort already connected
      if (wires.some(w => w.toGateId === toGate && w.toPort === toPort)) {
        return; // Already connected
      }

      setWires(ws => [...ws, {
        id: `wire-${Math.random().toString(36).substr(2, 9)}`,
        fromGateId: fromGate,
        fromPort,
        toGateId: toGate,
        toPort,
        state: false
      }]);
    }
    setDrawingWire(null);
  };

  // Keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setGates(gs => gs.filter(g => !selectedIds.includes(g.id)));
        setWires(ws => ws.filter(w => !selectedIds.includes(w.id) && !selectedIds.includes(w.fromGateId) && !selectedIds.includes(w.toGateId)));
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, setGates, setWires, setSelectedIds]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('gateType') as GateType;
    if (type && GATE_CONFIG[type]) {
      const coords = toCanvasCoords(e as unknown as React.MouseEvent);
      const conf = GATE_CONFIG[type];
      const newGate: Gate = {
        id: `gate-${Math.random().toString(36).substr(2, 9)}`,
        type,
        x: Math.round(coords.x / 20) * 20,
        y: Math.round(coords.y / 20) * 20,
        inputCount: conf.defaultInputs,
        inputs: new Array(conf.defaultInputs).fill(false),
        outputs: new Array(conf.outputs).fill(false),
        state: type === 'CLOCK' ? { frequency: clockHz } : {}
      };
      setGates(gs => [...gs, newGate]);
    }
  };

  // Helpers to get port coords
  const getPortCoords = (gateId: string, portId: string, isOutput: boolean) => {
    const g = gates.find(g => g.id === gateId);
    if (!g) return { x: 0, y: 0 };
    
    const height = Math.max(40, g.inputCount * 15);
    const isBasic = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'].includes(g.type);
    const hasCircle = ['NAND', 'NOR', 'XNOR', 'NOT'].includes(g.type);
    
    if (isOutput) {
      const match = portId.match(/out-(\d+)/);
      const idx = match ? parseInt(match[1]) : 0;
      const y = g.outputs.length === 1 ? height / 2 : 10 + (idx * (height - 20) / Math.max(1, g.outputs.length - 1));
      const x = isBasic ? (hasCircle ? 39 : 35) : 40;
      return { x: g.x + x + 10, y: g.y + y }; // +10 for the stub line
    } else {
      const match = portId.match(/in-(\d+)/);
      const idx = match ? parseInt(match[1]) : 0;
      const y = g.inputCount === 1 ? height / 2 : 10 + (idx * (height - 20) / Math.max(1, g.inputCount - 1));
      return { x: g.x - 10, y: g.y + y };
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
            const fromC = getPortCoords(w.fromGateId, w.fromPort, true);
            const toC = getPortCoords(w.toGateId, w.toPort, false);
            return (
              <WireNode 
                key={w.id} 
                wire={w} 
                fromX={fromC.x} fromY={fromC.y} 
                toX={toC.x} toY={toC.y} 
                selected={selectedIds.includes(w.id)}
                onSelect={(e, id) => {
                  e.stopPropagation();
                  setSelectedIds(e.shiftKey ? [...selectedIds, id] : [id]);
                }}
              />
            );
          })}

          {/* Temporary Wire drawing */}
          {drawingWire && (
            <path 
              d={`M ${drawingWire.isOutput ? getPortCoords(drawingWire.gateId, drawingWire.portId, true).x : mousePos.x} ${drawingWire.isOutput ? getPortCoords(drawingWire.gateId, drawingWire.portId, true).y : mousePos.y} L ${drawingWire.isOutput ? mousePos.x : getPortCoords(drawingWire.gateId, drawingWire.portId, false).x} ${drawingWire.isOutput ? mousePos.y : getPortCoords(drawingWire.gateId, drawingWire.portId, false).y}`}
              fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5"
            />
          )}

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
