import { Link } from 'wouter';
import { useGetCircuitStats, useListCircuits, useCreateCircuit, getListCircuitsQueryKey, getGetCircuitStatsQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Clock, Share2, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useDeleteCircuit } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { data: stats } = useGetCircuitStats();
  const { data: circuits } = useListCircuits();
  const createMutation = useCreateCircuit();
  const deleteMutation = useDeleteCircuit();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const hasCircuits = circuits && circuits.length > 0;

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shashank Logic Labs</h1>
            <p className="text-sm text-muted-foreground mt-1">Digital circuit simulator for serious work</p>
          </div>
          <Button onClick={handleNew} size="lg" className="gap-2 font-semibold">
            <Plus className="w-5 h-5" />
            New Circuit
          </Button>
        </div>
      </div>

      {/* Stats */}
      {hasCircuits && stats && (
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total Circuits</CardDescription>
                <CardTitle className="text-4xl font-bold text-primary">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Public Circuits</CardDescription>
                <CardTitle className="text-4xl font-bold text-primary">{stats.publicCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      )}

      {/* Circuit List or Empty State */}
      <div className="max-w-7xl mx-auto px-8 pb-12">
        {!hasCircuits ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Plus className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No circuits yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Start building your first logic circuit. Create gates, connect wires, simulate in real-time.
            </p>
            <Button onClick={handleNew} size="lg" className="gap-2 font-semibold">
              <Plus className="w-5 h-5" />
              Create First Circuit
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-6">Your Circuits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {circuits.map(circuit => (
                <Link key={circuit.id} href={`/editor/${circuit.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{circuit.name}</CardTitle>
                        <button 
                          onClick={(e) => handleDelete(circuit.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                      {circuit.description && (
                        <CardDescription className="line-clamp-2">{circuit.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(circuit.updatedAt).toLocaleDateString()}
                        </div>
                        {circuit.shareCode && (
                          <div className="flex items-center gap-1 text-primary">
                            <Share2 className="w-3 h-3" />
                            Shared
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/40 mt-8">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Shashank Logic Labs</span>
          <span>Built by a student of <span className="text-primary font-medium">KLE Polytechnic, Hubli</span></span>
        </div>
      </div>
    </div>
  );
}
