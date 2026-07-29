import { useParams } from 'wouter';
import { useGetSharedCircuit, getGetSharedCircuitQueryKey } from '@workspace/api-client-react';
import { useState } from 'react';
import { Gate, Wire } from '@/lib/circuit/types';
import { Palette } from '@/components/circuit/Palette';
import { Canvas } from '@/components/circuit/Canvas';
import { PropertiesPanel } from '@/components/circuit/PropertiesPanel';
import { Toolbar } from '@/components/circuit/Toolbar';

export default function SharedCircuit() {
  const params = useParams<{ shareCode: string }>();
  const { data: circuit, isLoading } = useGetSharedCircuit(params.shareCode || '', {
    query: {
      enabled: !!params.shareCode,
      queryKey: getGetSharedCircuitQueryKey(params.shareCode || '')
    }
  });

  const data = (circuit?.data || {}) as any;
  const [gates, setGates] = useState<Gate[]>(data.gates || []);
  const [wires, setWires] = useState<Wire[]>(data.wires || []);
  const [running, setRunning] = useState(false);
  const [clockHz, setClockHz] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center text-muted-foreground">Loading shared circuit...</div>;
  }

  if (!circuit) {
    return <div className="h-screen w-full flex items-center justify-center text-muted-foreground">Circuit not found</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <Toolbar 
        name={circuit.name} 
        setName={() => {}}
        running={running} setRunning={setRunning}
        clockHz={clockHz} setClockHz={setClockHz}
        onSave={() => {}}
        onShare={() => {}}
        onExport={() => {}}
        readOnly
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Palette />
        <div className="flex-1">
          <Canvas 
            gates={gates} setGates={setGates}
            wires={wires} setWires={setWires}
            running={running}
            clockHz={clockHz}
            selectedIds={selectedIds} setSelectedIds={setSelectedIds}
          />
        </div>
        <PropertiesPanel selectedIds={selectedIds} gates={gates} setGates={setGates} wires={wires} />
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-lg shadow-lg text-sm text-muted-foreground">
        Read-only view — you are viewing a shared circuit
      </div>
    </div>
  );
}
