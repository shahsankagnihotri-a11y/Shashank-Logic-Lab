import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useGetCircuitStats, useListCircuits, useCreateCircuit, useDeleteCircuit, getListCircuitsQueryKey, getGetCircuitStatsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Clock, Share2, Trash2, Search, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  
  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);
  
  return <motion.span>{rounded}</motion.span>;
}

function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    
    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    const nodes = Array.from({ length: 75 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));
    
    let animationFrame: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0, 255, 65, 0.4)';
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.08)';
      
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      
      animationFrame = requestAnimationFrame(draw);
    };
    draw();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-50" />;
}

export default function Dashboard() {
  const { data: stats } = useGetCircuitStats();
  const { data: circuits } = useListCircuits();
  const createMutation = useCreateCircuit();
  const deleteMutation = useDeleteCircuit();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');

  const handleNew = () => {
    createMutation.mutate({ data: { name: 'Untitled Circuit', data: { gates: [], wires: [] } } }, {
      onSuccess: (circuit) => {
        queryClient.invalidateQueries({ queryKey: getListCircuitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCircuitStatsQueryKey() });
        setLocation(`/editor/${circuit.id}`);
      }
    });
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this circuit?')) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: 'Deleted', description: 'Circuit removed successfully.' });
          queryClient.invalidateQueries({ queryKey: getListCircuitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCircuitStatsQueryKey() });
        }
      });
    }
  };

  const filteredCircuits = circuits?.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) || [];
  const hasCircuits = circuits && circuits.length > 0;

  const totalGates = circuits?.reduce((sum, c) => sum + (((c.data as any)?.gates?.length) || 0), 0) || 0;
  const totalWires = circuits?.reduce((sum, c) => sum + (((c.data as any)?.wires?.length) || 0), 0) || 0;

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden flex flex-col">
      <NetworkBackground />
      <div className="scanline-overlay" />
      
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur z-20 relative shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight neon-text flex items-center gap-3">
              <span className="animate-pulse">⚡</span> SHASHANK LOGIC LABS
            </h1>
            <p className="text-sm text-primary/70 mt-2 mono font-medium">
              Build · Simulate · Share<span className="animate-[blink_1s_step-end_infinite] font-bold">_</span>
            </p>
          </div>
          <Button 
            onClick={handleNew} 
            size="lg" 
            className="gap-2 font-bold mono bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(0,255,65,0.4)]"
          >
            <Plus className="w-5 h-5" />
            NEW CIRCUIT
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative z-10 scrollbar-none">
        {/* Stats */}
        {hasCircuits && stats && (
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Circuits', value: stats.total },
                { label: 'Public Circuits', value: stats.publicCount },
                { label: 'Gates Simulated', value: totalGates },
                { label: 'Wires Connected', value: totalWires }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-card/40 border-border/50 border-l-4 border-l-primary/50 hover:border-l-primary hover:shadow-[0_0_15px_rgba(0,255,65,0.15)] transition-all relative overflow-hidden group h-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <CardHeader className="pb-3 relative z-10">
                      <CardDescription className="text-xs mono uppercase tracking-wider font-semibold text-muted-foreground group-hover:text-primary/70 transition-colors">{stat.label}</CardDescription>
                      <CardTitle className="text-3xl md:text-4xl font-bold neon-text"><AnimatedNumber value={stat.value} /></CardTitle>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Circuit List or Empty State */}
        <div className="max-w-7xl mx-auto px-8 pb-20">
          {!hasCircuits ? (
            <div className="flex flex-col items-center justify-center py-20 lg:py-32 text-center relative z-10">
              <svg className="w-32 h-32 md:w-40 md:h-40 mb-8" viewBox="0 0 100 100" fill="none" stroke="hsl(var(--primary))" strokeWidth="2">
                <motion.path 
                  d="M 20 20 L 50 20 A 30 30 0 0 1 80 50 A 30 30 0 0 1 50 80 L 20 80 Z" 
                  initial={{ strokeDasharray: 200, strokeDashoffset: 200 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.line x1="0" y1="35" x2="20" y2="35" 
                  initial={{ strokeDasharray: 20, strokeDashoffset: 20 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.line x1="0" y1="65" x2="20" y2="65" 
                  initial={{ strokeDasharray: 20, strokeDashoffset: 20 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.line x1="80" y1="50" x2="100" y2="50" 
                  initial={{ strokeDasharray: 20, strokeDashoffset: 20 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1, delay: 1, repeat: Infinity, repeatType: "reverse" }}
                />
              </svg>
              <h2 className="text-2xl font-bold mb-4 mono neon-text tracking-wide">Your first circuit starts here</h2>
              <p className="text-muted-foreground/80 mb-8 max-w-md">
                Wire up logic gates, build complex systems, and simulate them in real-time.
              </p>
              <Button onClick={handleNew} size="lg" className="gap-2 font-bold mono bg-primary text-primary-foreground hover:bg-primary/90 animate-[pulse-glow_2s_infinite] hover:animate-none shadow-[0_0_20px_rgba(0,255,65,0.4)]">
                <Plus className="w-5 h-5" />
                CREATE CIRCUIT
              </Button>
            </div>
          ) : (
            <div className="pt-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-xl font-bold mono neon-text flex items-center gap-2">
                  <Cpu className="w-5 h-5" /> Your Systems
                </h2>
                <div className="relative max-w-sm w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <input 
                    type="text" 
                    placeholder="Search systems..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-card/50 border border-border/50 text-foreground text-sm rounded-md pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 mono transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {filteredCircuits.length === 0 ? (
                <div className="text-center py-16 mono text-muted-foreground">No circuits found matching "{search}"</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredCircuits.map((circuit, i) => (
                      <motion.div
                        key={circuit.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: i * 0.08 }}
                      >
                        <Card 
                          onClick={() => setLocation(`/editor/${circuit.id}`)}
                          className="bg-card/60 backdrop-blur border-border/50 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] transition-all cursor-pointer group h-full relative overflow-hidden flex flex-col"
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,hsl(var(--primary)/0.05),transparent)] -translate-y-[100%] group-hover:animate-[scanline_2s_linear_infinite] pointer-events-none" />
                          
                          <CardHeader className="flex-none pb-4">
                            <div className="flex items-start justify-between gap-4">
                              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors mono truncate text-foreground/90 group-hover:neon-text">{circuit.name}</CardTitle>
                              <button 
                                onClick={(e) => handleDelete(circuit.id, e)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 -mr-2 -mt-2 hover:bg-destructive/20 hover:text-destructive rounded text-muted-foreground z-20 shrink-0"
                                title="Delete Circuit"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {circuit.description && (
                              <CardDescription className="line-clamp-2 text-sm mt-2 font-mono">{circuit.description}</CardDescription>
                            )}
                          </CardHeader>
                          
                          <CardContent className="flex-1 flex flex-col justify-end">
                            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mb-4">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                {((circuit.data as any)?.gates?.length || 0)} gates
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                {((circuit.data as any)?.wires?.length || 0)} wires
                              </span>
                            </div>
                            
                            <div className="pt-4 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-primary/70" />
                                {new Date(circuit.updatedAt).toLocaleDateString()}
                              </div>
                              {circuit.shareCode && (
                                <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded font-bold uppercase tracking-wider">
                                  <Share2 className="w-3 h-3" />
                                  Shared
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/40 bg-card/80 backdrop-blur z-20 relative">
        <div className="max-w-7xl mx-auto px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground mono">
          <span className="font-bold tracking-widest text-[10px]">SHASHANK LOGIC LABS</span>
          <span className="flex items-center gap-2">
            Built by a student of <span className="text-primary font-bold">KLE Polytechnic, Hubli</span> · est. 2026
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(0,255,65,0.8)]" />
          </span>
        </div>
      </div>
    </div>
  );
}
