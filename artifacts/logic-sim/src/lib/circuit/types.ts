export type GateType = 
  | 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'BUFFER'
  | 'SWITCH' | 'CLOCK' 
  | 'LED' | 'SEVEN_SEG'
  | 'D_FF' | 'SR_LATCH' | 'JK_FF' | 'T_FF'
  | 'MUX' | 'DEMUX'
  | 'HALF_ADDER' | 'FULL_ADDER';

export const INPUT_GATE_TYPES: GateType[]  = ['SWITCH', 'CLOCK'];
export const OUTPUT_GATE_TYPES: GateType[] = ['LED', 'SEVEN_SEG'];
export const LOGIC_GATE_TYPES: GateType[]  = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'];

export interface Gate {
  id: string;
  type: GateType;
  x: number;
  y: number;
  label?: string;
  inputs: boolean[];
  outputs: boolean[];
  state: any;
  inputCount: number;
  /** Visual scale multiplier (default 1). Affects rendering size and port positions. */
  scale?: number;
}

export interface Wire {
  id: string;
  fromGateId: string;
  fromPort: string;
  toGateId: string;
  toPort: string;
  state: boolean;
}

export interface CircuitState {
  gates: Gate[];
  wires: Wire[];
}

export const GATE_CONFIG: Record<GateType, { defaultInputs: number, outputs: number, label: string, category: string }> = {
  AND: { defaultInputs: 2, outputs: 1, label: 'AND', category: 'Basic' },
  OR: { defaultInputs: 2, outputs: 1, label: 'OR', category: 'Basic' },
  NOT: { defaultInputs: 1, outputs: 1, label: 'NOT', category: 'Basic' },
  NAND: { defaultInputs: 2, outputs: 1, label: 'NAND', category: 'Basic' },
  NOR: { defaultInputs: 2, outputs: 1, label: 'NOR', category: 'Basic' },
  XOR: { defaultInputs: 2, outputs: 1, label: 'XOR', category: 'Basic' },
  XNOR: { defaultInputs: 2, outputs: 1, label: 'XNOR', category: 'Basic' },
  BUFFER: { defaultInputs: 1, outputs: 1, label: 'BUFFER', category: 'Basic' },
  
  SWITCH: { defaultInputs: 0, outputs: 1, label: 'Switch', category: 'I/O' },
  CLOCK: { defaultInputs: 0, outputs: 1, label: 'Clock', category: 'I/O' },
  LED: { defaultInputs: 1, outputs: 0, label: 'LED', category: 'I/O' },
  SEVEN_SEG: { defaultInputs: 4, outputs: 0, label: '7-Seg', category: 'I/O' },
  
  D_FF: { defaultInputs: 2, outputs: 2, label: 'D Flip-Flop', category: 'Sequential' },
  SR_LATCH: { defaultInputs: 2, outputs: 2, label: 'SR Latch', category: 'Sequential' },
  JK_FF: { defaultInputs: 3, outputs: 2, label: 'JK Flip-Flop', category: 'Sequential' },
  T_FF: { defaultInputs: 2, outputs: 2, label: 'T Flip-Flop', category: 'Sequential' },
  
  MUX: { defaultInputs: 3, outputs: 1, label: 'MUX 2:1', category: 'Complex' },
  DEMUX: { defaultInputs: 2, outputs: 2, label: 'DEMUX 1:2', category: 'Complex' },
  HALF_ADDER: { defaultInputs: 2, outputs: 2, label: 'Half Adder', category: 'Complex' },
  FULL_ADDER: { defaultInputs: 3, outputs: 2, label: 'Full Adder', category: 'Complex' }
};
