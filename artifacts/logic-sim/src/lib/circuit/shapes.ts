import { GateType } from './types';

// Renders IEEE or Block standard gates based on type
export const getGateSvgPath = (type: GateType) => {
  switch (type) {
    case 'AND': return "M 5 5 h 15 a 15 15 0 0 1 15 15 a 15 15 0 0 1 -15 15 h -15 z";
    case 'OR': return "M 5 5 q 15 15 0 30 q 15 0 30 -15 q -15 -15 -30 -15";
    case 'NAND': return "M 5 5 h 15 a 15 15 0 0 1 15 15 a 15 15 0 0 1 -15 15 h -15 z"; // Will add circle in component
    case 'NOR': return "M 5 5 q 15 15 0 30 q 15 0 30 -15 q -15 -15 -30 -15"; // Will add circle
    case 'XOR': return "M 10 5 q 15 15 0 30 q 15 0 30 -15 q -15 -15 -30 -15 M 5 5 q 15 15 0 30";
    case 'XNOR': return "M 10 5 q 15 15 0 30 q 15 0 30 -15 q -15 -15 -30 -15 M 5 5 q 15 15 0 30"; // Will add circle
    case 'NOT': return "M 5 5 l 20 10 l -20 10 z"; // Triangle
    case 'BUFFER': return "M 5 5 l 20 10 l -20 10 z"; // Triangle
    default: return "M 0 0 h 40 v 40 h -40 z"; // Default box
  }
};

export const hasInversionCircle = (type: GateType) => {
  return ['NAND', 'NOR', 'XNOR', 'NOT'].includes(type);
};
