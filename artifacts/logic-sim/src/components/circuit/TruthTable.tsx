import React from 'react';
import { GateType } from '@/lib/circuit/types';
import { motion } from 'framer-motion';

interface TruthTableProps {
  type: GateType;
  inputCount: number;
}

export const TruthTable: React.FC<TruthTableProps> = ({ type, inputCount }) => {
  const isLogicGate = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'NOT', 'BUFFER'].includes(type);
  if (!isLogicGate) return null;

  const inputs = (type === 'NOT' || type === 'BUFFER') ? 1 : Math.min(inputCount, 4);
  const rows = Math.pow(2, inputs);

  const getOutput = (vals: number[]): number => {
    let res = vals[0];
    for (let i = 1; i < vals.length; i++) {
      if (type === 'AND' || type === 'NAND') res = res & vals[i];
      else if (type === 'OR' || type === 'NOR') res = res | vals[i];
      else if (type === 'XOR' || type === 'XNOR') res = res ^ vals[i];
    }
    if (type === 'NAND' || type === 'NOR' || type === 'XNOR' || type === 'NOT') res = res === 1 ? 0 : 1;
    if (type === 'BUFFER') res = vals[0];
    return res;
  };

  const tableRows = [];
  for (let i = 0; i < rows; i++) {
    const vals = [];
    for (let j = inputs - 1; j >= 0; j--) {
      vals.push((i >> j) & 1);
    }
    const out = getOutput(vals);
    tableRows.push({ vals, out });
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 border border-primary/30 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(0,255,65,0.05)]"
    >
      <div className="bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary border-b border-primary/30 mono">
        Truth Table ({type})
      </div>
      <table className="w-full text-sm text-center bg-card/50">
        <thead className="bg-muted/30 border-b border-border">
          <tr>
            {Array.from({ length: inputs }).map((_, i) => (
              <th key={i} className="py-2 font-medium text-muted-foreground mono text-xs">In {i + 1}</th>
            ))}
            <th className="py-2 font-bold text-primary border-l border-border mono text-xs">Out</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {tableRows.map((row, i) => (
            <tr key={i} className="hover:bg-primary/5 transition-colors">
              {row.vals.map((v, j) => (
                <td key={j} className={`py-1.5 mono text-xs ${v === 1 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {v}
                </td>
              ))}
              <td className={`py-1.5 mono text-xs border-l border-border ${row.out === 1 ? 'text-primary font-bold neon-text' : 'text-muted-foreground'}`}>
                {row.out}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};
