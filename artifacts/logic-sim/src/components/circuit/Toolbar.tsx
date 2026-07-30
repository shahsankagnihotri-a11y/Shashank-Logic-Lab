import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Save, Share2, Download, ArrowLeft, FolderOpen, FileDown, HelpCircle, Trash2 } from 'lucide-react';
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
  onSaveFile: () => void;
  onLoadFile: (file: File) => void;
  onClearAll?: () => void;
  onHelp?: () => void;
  readOnly?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  name, setName, running, setRunning, clockHz, setClockHz,
  onSave, onShare, onExport, onSaveFile, onLoadFile, onClearAll, onHelp, readOnly
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-14 border-b border-border bg-card/90 backdrop-blur flex items-center justify-between px-4 shrink-0 gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative z-20">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="h-6 w-px bg-border shrink-0" />
        {readOnly ? (
          <span className="font-bold text-lg truncate mono text-foreground/90">{name}</span>
        ) : (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-transparent border-none font-bold text-lg focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-2 py-1 min-w-0 w-48 truncate mono text-primary"
            placeholder="Untitled Circuit"
          />
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={onHelp} title="Keyboard Shortcuts" className="hover:text-primary transition-colors text-muted-foreground">
          <HelpCircle className="w-5 h-5" />
        </Button>
        <div className="h-6 w-px bg-border shrink-0" />

        {/* Simulate controls */}
        <div className="flex items-center gap-2">
          {running && (
            <div className="flex items-center gap-2 mr-2 px-2.5 py-1 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(255,0,0,0.2)]">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Live
            </div>
          )}
          <Button
            variant={running ? 'outline' : 'default'}
            size="sm"
            onClick={() => setRunning(!running)}
            className={`gap-2 mono font-bold ${running ? 'border-primary/50 text-primary hover:bg-primary/10' : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,65,0.3)]'}`}
            data-testid="button-run-pause"
          >
            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Run</>}
          </Button>
        </div>

        {/* Clock speed */}
        <div className="flex items-center gap-3 w-48 border-l border-border pl-4">
          <span className="text-xs font-bold mono text-muted-foreground whitespace-nowrap min-w-[60px]">Clk: {clockHz}Hz</span>
          <Slider
            value={[clockHz]}
            onValueChange={v => setClockHz(v[0])}
            min={1} max={100} step={1}
            className="flex-1"
            data-testid="slider-clock-hz"
          />
        </div>

        {/* File + share actions */}
        <div className="flex items-center gap-1 border-l border-border pl-4">
          {!readOnly && (
            <>
              {/* Clear all */}
              <Button
                variant="ghost" size="icon"
                onClick={onClearAll}
                title="Clear all — delete every gate and wire"
                className="hover:text-destructive transition-colors text-muted-foreground"
                data-testid="button-clear-all"
              >
                <Trash2 className="w-5 h-5" />
              </Button>

              {/* Save to server */}
              <Button variant="ghost" size="icon" onClick={onSave} title="Save to cloud (Ctrl+S)" className="hover:text-primary transition-colors text-muted-foreground" data-testid="button-save-cloud">
                <Save className="w-5 h-5" />
              </Button>

              {/* Save to local file */}
              <Button variant="ghost" size="icon" onClick={onSaveFile} title="Download project file (.sll)" className="hover:text-primary transition-colors text-muted-foreground" data-testid="button-save-file">
                <FileDown className="w-5 h-5" />
              </Button>

              {/* Load from local file */}
              <Button
                variant="ghost" size="icon"
                title="Load project file (.sll)"
                data-testid="button-load-file"
                className="hover:text-primary transition-colors text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <FolderOpen className="w-5 h-5" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".sll,.json"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) onLoadFile(f);
                  e.target.value = ''; // reset so same file can be re-loaded
                }}
              />
            </>
          )}

          <Button variant="ghost" size="icon" onClick={onShare} title="Share circuit" className="hover:text-primary transition-colors text-muted-foreground" data-testid="button-share">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onExport} title="Export as PNG" className="hover:text-primary transition-colors text-muted-foreground" data-testid="button-export-png">
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
