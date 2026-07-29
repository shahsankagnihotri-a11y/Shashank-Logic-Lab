import { Gate, Wire } from './types';

export function simulateTick(gates: Gate[], wires: Wire[], time: number): { gates: Gate[], wires: Wire[] } {
  const newGates = gates.map(g => ({ ...g, inputs: [...g.inputs], outputs: [...g.outputs], state: { ...g.state } }));
  const newWires = wires.map(w => ({ ...w }));

  // 1. Map wire states to gate inputs
  const gateInputMap: Record<string, boolean[]> = {};
  for (const g of newGates) {
    gateInputMap[g.id] = new Array(g.inputCount).fill(false);
  }

  for (const w of newWires) {
    const toMatch = w.toPort.match(/in-(\d+)/);
    if (toMatch && gateInputMap[w.toGateId]) {
      gateInputMap[w.toGateId][parseInt(toMatch[1])] = w.state;
    }
  }

  for (const g of newGates) {
    g.inputs = gateInputMap[g.id];
  }

  // 2. Compute outputs
  for (const g of newGates) {
    let newOut: boolean[] = [];
    
    switch (g.type) {
      case 'AND': newOut = [g.inputs.length > 0 && g.inputs.every(x => x)]; break;
      case 'OR': newOut = [g.inputs.some(x => x)]; break;
      case 'NOT': newOut = [!g.inputs[0]]; break;
      case 'NAND': newOut = [!(g.inputs.length > 0 && g.inputs.every(x => x))]; break;
      case 'NOR': newOut = [!g.inputs.some(x => x)]; break;
      case 'XOR': newOut = [g.inputs.filter(x => x).length % 2 === 1]; break;
      case 'XNOR': newOut = [g.inputs.filter(x => x).length % 2 === 0]; break;
      case 'BUFFER': newOut = [!!g.inputs[0]]; break;
      
      case 'SWITCH': newOut = [!!g.state.isOn]; break;
      case 'CLOCK': {
        const freq = g.state.frequency || 1; // Hz
        const period = 1000 / freq;
        if (time - (g.state.lastToggleTime || 0) >= period / 2) {
          g.state.isOn = !g.state.isOn;
          g.state.lastToggleTime = time;
        }
        newOut = [!!g.state.isOn];
        break;
      }
      case 'LED':
        g.state.isOn = !!g.inputs[0];
        break;
      case 'SEVEN_SEG':
        // A simple 4-bit binary input to hex display
        g.state.value = (g.inputs[0]?1:0) + (g.inputs[1]?2:0) + (g.inputs[2]?4:0) + (g.inputs[3]?8:0);
        break;
        
      case 'D_FF': {
        // inputs: 0=D, 1=CLK
        const d = !!g.inputs[0];
        const clk = !!g.inputs[1];
        const lastClk = !!g.state.lastClk;
        let q = g.state.q ?? false;
        
        if (clk && !lastClk) q = d; // Rising edge
        
        g.state.lastClk = clk;
        g.state.q = q;
        newOut = [q, !q];
        break;
      }
      case 'SR_LATCH': {
        // inputs: 0=S, 1=R
        const s = !!g.inputs[0];
        const r = !!g.inputs[1];
        let q = g.state.q ?? false;
        
        if (s && !r) q = true;
        if (r && !s) q = false;
        if (s && r) q = false; // invalid state -> false
        
        g.state.q = q;
        newOut = [q, !q];
        break;
      }
      case 'JK_FF': {
        // inputs: 0=J, 1=K, 2=CLK
        const j = !!g.inputs[0];
        const k = !!g.inputs[1];
        const clk = !!g.inputs[2];
        const lastClk = !!g.state.lastClk;
        let q = g.state.q ?? false;
        
        if (clk && !lastClk) {
          if (j && !k) q = true;
          else if (!j && k) q = false;
          else if (j && k) q = !q;
        }
        
        g.state.lastClk = clk;
        g.state.q = q;
        newOut = [q, !q];
        break;
      }
      case 'T_FF': {
        // inputs: 0=T, 1=CLK
        const t = !!g.inputs[0];
        const clk = !!g.inputs[1];
        const lastClk = !!g.state.lastClk;
        let q = g.state.q ?? false;
        
        if (clk && !lastClk && t) {
          q = !q;
        }
        
        g.state.lastClk = clk;
        g.state.q = q;
        newOut = [q, !q];
        break;
      }
      case 'MUX': {
        // inputs: 0=D0, 1=D1, 2=SEL
        const sel = !!g.inputs[2];
        newOut = [sel ? !!g.inputs[1] : !!g.inputs[0]];
        break;
      }
      case 'DEMUX': {
        // inputs: 0=D, 1=SEL
        const d = !!g.inputs[0];
        const sel = !!g.inputs[1];
        newOut = [sel ? false : d, sel ? d : false];
        break;
      }
      case 'HALF_ADDER': {
        // inputs: 0=A, 1=B
        const a = !!g.inputs[0];
        const b = !!g.inputs[1];
        newOut = [a !== b, a && b]; // Sum, Carry
        break;
      }
      case 'FULL_ADDER': {
        // inputs: 0=A, 1=B, 2=Cin
        const a = !!g.inputs[0];
        const b = !!g.inputs[1];
        const cin = !!g.inputs[2];
        const sum = a !== b !== cin;
        const cout = (a && b) || (cin && (a !== b));
        newOut = [sum, cout];
        break;
      }
      default:
        newOut = g.outputs;
    }
    
    g.outputs = newOut;
  }

  // 3. Update wire states from gate outputs
  for (const w of newWires) {
    const fromGate = newGates.find(g => g.id === w.fromGateId);
    if (fromGate) {
      const fromMatch = w.fromPort.match(/out-(\d+)/);
      if (fromMatch) {
        w.state = !!fromGate.outputs[parseInt(fromMatch[1])];
      }
    }
  }

  return { gates: newGates, wires: newWires };
}
