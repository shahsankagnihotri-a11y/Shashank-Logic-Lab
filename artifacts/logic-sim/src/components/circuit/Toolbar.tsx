import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Save, Share2, Download, Moon, Sun, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

interface ToolbarProps {
  name: string;
  setName: (n: string) => void;
  running: boolean;
  setRunning: (r: boolean) => void;
  clockHz: number;
  setClockHz: (hz: number) => void;
  onSave: () => void;
  onShare: () => void;
  onExport: () => void;
  readOnly?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  name, setName, running, setRunning, clockHz, setClockHz, onSave, onShare, onExport, readOnly
}) => {
  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="h-6 w-px bg-border"></div>
        {readOnly ? (
          <span className="font-bold text-lg">{name}</span>
        ) : (
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="bg-transparent border-none font-bold text-lg focus:outline-none focus:ring-1 focus:ring-ring rounded px-1"
          />
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Button variant={running ? "outline" : "default"} size="sm" onClick={() => setRunning(!running)} className="gap-2">
            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Run</>}
          </Button>
        </div>

        <div className="flex items-center gap-3 w-48 border-l border-border pl-6">
          <span className="text-xs font-medium text-muted-foreground">Clock: {clockHz}Hz</span>
          <Slider 
            value={[clockHz]} 
            onValueChange={v => setClockHz(v[0])} 
            min={1} max={100} step={1}
            className="flex-1"
          />
        </div>

        <div className="flex items-center gap-2 border-l border-border pl-6">
          {!readOnly && (
            <Button variant="ghost" size="icon" onClick={onSave} title="Save (Ctrl+S)">
              <Save className="w-5 h-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onShare} title="Share Circuit">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onExport} title="Export PNG">
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
