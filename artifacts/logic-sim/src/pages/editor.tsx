import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useGetCircuit, 
  useUpdateCircuit, 
  useCreateCircuit, 
  useShareCircuit,
  getGetCircuitQueryKey,
  getListCircuitsQueryKey,
  getGetCircuitStatsQueryKey
} from '@workspace/api-client-react';
import { Gate, Wire } from '@/lib/circuit/types';
import { Palette } from '@/components/circuit/Palette';
import { Canvas } from '@/components/circuit/Canvas';
import { PropertiesPanel } from '@/components/circuit/PropertiesPanel';
import { Toolbar } from '@/components/circuit/Toolbar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function Editor() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isNew = !params.id || params.id === 'new';
  const circuitId = isNew ? undefined : parseInt(params.id || '0');

  const queryClient = useQueryClient();
  const { data: circuit, isLoading } = useGetCircuit(circuitId || 0, { 
    query: { 
      enabled: !!circuitId && !isNew,
      queryKey: getGetCircuitQueryKey(circuitId || 0)
    }
  });
  
  const updateMutation = useUpdateCircuit();
  const createMutation = useCreateCircuit();
  const shareMutation = useShareCircuit();
  const { toast } = useToast();

  const [name, setName] = useState('Untitled Circuit');
  const [gates, setGates] = useState<Gate[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [running, setRunning] = useState(false);
  const [clockHz, setClockHz] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Initialization
  const initializedForId = useRef<number | null>(null);
  useEffect(() => {
    if (circuit && circuitId && initializedForId.current !== circuitId) {
      initializedForId.current = circuitId;
      setName(circuit.name);
      const data = circuit.data as any;
      setGates(data?.gates || []);
      setWires(data?.wires || []);
    }
  }, [circuit, circuitId]);

  const handleSave = useCallback(() => {
    const data = { gates, wires };
    
    if (isNew || !circuitId) {
      createMutation.mutate({ data: { name, data } }, {
        onSuccess: (created) => {
          toast({ title: 'Circuit created!', description: 'Your circuit has been saved.' });
          queryClient.invalidateQueries({ queryKey: getListCircuitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCircuitStatsQueryKey() });
          setLocation(`/editor/${created.id}`);
        }
      });
    } else {
      updateMutation.mutate({ id: circuitId, data: { name, data } }, {
        onSuccess: () => {
          toast({ title: 'Saved!', description: 'Your circuit has been updated.' });
          queryClient.invalidateQueries({ queryKey: getGetCircuitQueryKey(circuitId) });
          queryClient.invalidateQueries({ queryKey: getListCircuitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCircuitStatsQueryKey() });
        }
      });
    }
  }, [gates, wires, name, isNew, circuitId, createMutation, updateMutation, toast, queryClient, setLocation]);

  const handleShare = useCallback(() => {
    if (!circuitId) {
      toast({ title: 'Save first', description: 'Please save the circuit before sharing.' });
      return;
    }
    shareMutation.mutate({ id: circuitId }, {
      onSuccess: (data) => {
        setShareUrl(data.shareUrl);
        setShareDialogOpen(true);
      }
    });
  }, [circuitId, shareMutation, toast]);

  const handleExport = () => {
    toast({ title: 'Export PNG', description: 'Coming soon!' });
  };

  // Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (isLoading && !isNew) {
    return <div className="h-screen w-full flex items-center justify-center text-muted-foreground">Loading circuit...</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <Toolbar 
        name={name} setName={setName}
        running={running} setRunning={setRunning}
        clockHz={clockHz} setClockHz={setClockHz}
        onSave={handleSave}
        onShare={handleShare}
        onExport={handleExport}
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

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Circuit</DialogTitle>
            <DialogDescription>Anyone with this link can view (but not edit) your circuit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Share URL</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly onClick={(e) => e.currentTarget.select()} />
              <Button variant="outline" onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast({ title: 'Copied!', description: 'Link copied to clipboard' });
              }}>
                Copy
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
