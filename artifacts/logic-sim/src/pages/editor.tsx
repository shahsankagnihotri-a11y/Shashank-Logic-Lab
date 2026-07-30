import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
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
import { Share2 } from 'lucide-react';

const FILE_EXTENSION = '.sll'; // Shashank Logic Labs format

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
  const shareMutation  = useShareCircuit();
  const { toast } = useToast();

  const [name, setName]             = useState('Untitled Circuit');
  const [gates, setGates]           = useState<Gate[]>([]);
  const [wires, setWires]           = useState<Wire[]>([]);
  const [running, setRunning]       = useState(false);
  const [clockHz, setClockHz]       = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen]     = useState(false);
  const [shareUrl, setShareUrl]     = useState('');

  // Initialise from server data
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

  // ── Cloud save ────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const data = { gates, wires };
    if (isNew || !circuitId) {
      createMutation.mutate({ data: { name, data } }, {
        onSuccess: (created) => {
          toast({ title: 'Circuit created!', description: 'Saved to cloud.' });
          queryClient.invalidateQueries({ queryKey: getListCircuitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCircuitStatsQueryKey() });
          setLocation(`/editor/${created.id}`);
        }
      });
    } else {
      updateMutation.mutate({ id: circuitId, data: { name, data } }, {
        onSuccess: () => {
          toast({ title: 'Saved!', description: 'Circuit updated in cloud.' });
          queryClient.invalidateQueries({ queryKey: getGetCircuitQueryKey(circuitId) });
          queryClient.invalidateQueries({ queryKey: getListCircuitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCircuitStatsQueryKey() });
        }
      });
    }
  }, [gates, wires, name, isNew, circuitId, createMutation, updateMutation, toast, queryClient, setLocation]);

  // ── Download project file ─────────────────────────────────────────────────
  const handleSaveFile = useCallback(() => {
    const payload = {
      version: 1,
      name,
      savedAt: new Date().toISOString(),
      gates,
      wires,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const safeName = name.replace(/[^a-z0-9_\- ]/gi, '_').trim() || 'circuit';
    a.href     = url;
    a.download = `${safeName}${FILE_EXTENSION}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'File downloaded', description: `${safeName}${FILE_EXTENSION}` });
  }, [gates, wires, name, toast]);

  // ── Load project file ─────────────────────────────────────────────────────
  const handleLoadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);

        if (!Array.isArray(parsed.gates) || !Array.isArray(parsed.wires)) {
          toast({ title: 'Invalid file', description: 'Not a valid Shashank Logic Labs project file.', variant: 'destructive' });
          return;
        }

        setGates(parsed.gates);
        setWires(parsed.wires);
        if (parsed.name) setName(parsed.name);
        toast({ title: 'Project loaded!', description: `Loaded "${parsed.name || file.name}"` });
      } catch {
        toast({ title: 'Failed to load', description: 'Could not parse the file.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  // ── Share ─────────────────────────────────────────────────────────────────
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

  // ── Export PNG ────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const svg = document.querySelector('.canvas-grid svg') as SVGSVGElement | null;
    if (!svg) {
      toast({ title: 'Nothing to export', description: 'Add some gates first.' });
      return;
    }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas  = document.createElement('canvas');
    const rect    = svg.getBoundingClientRect();
    canvas.width  = rect.width  || 1280;
    canvas.height = rect.height || 720;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#050a0f'; // Darker bg for export to match theme
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      const safeName = name.replace(/[^a-z0-9_\- ]/gi, '_').trim() || 'circuit';
      a.download = `${safeName}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast({ title: 'Exported!', description: `${safeName}.png downloaded.` });
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  }, [name, toast]);

  // ── Ctrl+S ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  if (isLoading && !isNew) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-primary mono bg-background">
        <span className="animate-pulse mb-4 text-4xl">⚡</span>
        Initializing system...
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <Toolbar
        name={name}       setName={setName}
        running={running} setRunning={setRunning}
        clockHz={clockHz} setClockHz={setClockHz}
        onSave={handleSave}
        onShare={handleShare}
        onExport={handleExport}
        onSaveFile={handleSaveFile}
        onLoadFile={handleLoadFile}
        onHelp={() => setHelpOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Palette />
        <div className="flex-1">
          <Canvas
            gates={gates}       setGates={setGates}
            wires={wires}       setWires={setWires}
            running={running}
            clockHz={clockHz}
            selectedIds={selectedIds} setSelectedIds={setSelectedIds}
          />
        </div>
        <PropertiesPanel selectedIds={selectedIds} gates={gates} setGates={setGates} wires={wires} />
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="border-primary/30 bg-card/95 backdrop-blur shadow-[0_0_50px_rgba(0,255,65,0.1)]">
          <DialogHeader>
            <DialogTitle className="neon-text flex items-center gap-2 font-mono">
              <Share2 className="w-5 h-5 text-primary" /> Share System
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-mono text-xs">
              Anyone with this secure uplink can view (but not edit) your circuit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <Label className="text-xs uppercase tracking-wider text-primary/80 mono font-bold">Secure Uplink URL</Label>
            <div className="flex gap-2">
              <Input 
                value={shareUrl} 
                readOnly 
                onClick={e => e.currentTarget.select()} 
                data-testid="input-share-url" 
                className="bg-background/50 border-primary/20 mono text-primary focus-visible:ring-primary/50"
              />
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/20 hover:text-primary font-mono" onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast({ title: 'Copied!', description: 'Uplink copied to clipboard' });
              }}>
                Copy
              </Button>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button className="font-mono bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShareDialogOpen(false)}>Close Uplink</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shortcuts Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="border-primary/30 bg-card/95 backdrop-blur shadow-[0_0_50px_rgba(0,255,65,0.1)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="neon-text flex items-center gap-2 font-mono text-xl">
              <span className="text-2xl animate-pulse">⚡</span> Shortcuts
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-mono text-xs">
              Master the system faster.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 py-4 text-sm mono">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Save</span><span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-xs">Ctrl+S</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Delete</span><span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-xs">Del/Back</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Deselect</span><span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-xs">Esc</span></div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Zoom</span><span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-xs">Scroll</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Pan</span><span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-xs">Shift+Drag</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Pan Alt</span><span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-xs">Space+Drag</span></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
