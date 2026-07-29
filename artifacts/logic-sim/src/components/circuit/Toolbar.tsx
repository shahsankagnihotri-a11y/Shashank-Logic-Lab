import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Save, Share2, Download, ArrowLeft, FolderOpen, FileDown } from 'lucide-react';
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
  readOnly?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  name, setName, running, setRunning, clockHz, setClockHz,
  onSave, onShare, onExport, onSaveFile, onLoadFile, readOnly
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="h-6 w-px bg-border shrink-0" />
        {readOnly ? (
          <span className="font-bold text-lg truncate">{name}</span>
        ) : (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-transparent border-none font-bold text-lg focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 min-w-0 w-44 truncate"
          />
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* Simulate controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={running ? 'outline' : 'default'}
            size="sm"
            onClick={() => setRunning(!running)}
            className="gap-2"
            data-testid="button-run-pause"
          >
            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Run</>}
          </Button>
        </div>

        {/* Clock speed */}
        <div className="flex items-center gap-2 w-44 border-l border-border pl-4">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Clock: {clockHz}Hz</span>
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
              {/* Save to server */}
              <Button variant="ghost" size="icon" onClick={onSave} title="Save to cloud (Ctrl+S)" data-testid="button-save-cloud">
                <Save className="w-5 h-5" />
              </Button>

              {/* Save to local file */}
              <Button variant="ghost" size="icon" onClick={onSaveFile} title="Download project file (.sll)" data-testid="button-save-file">
                <FileDown className="w-5 h-5" />
              </Button>

              {/* Load from local file */}
              <Button
                variant="ghost" size="icon"
                title="Load project file (.sll)"
                data-testid="button-load-file"
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

          <Button variant="ghost" size="icon" onClick={onShare} title="Share circuit" data-testid="button-share">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onExport} title="Export as PNG" data-testid="button-export-png">
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
