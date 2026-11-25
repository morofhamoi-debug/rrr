import { smoothNoise } from './field_01.js';
export function fieldHeight03(x,z){return Math.sin(z*0.0055+1.2)*1.8+Math.max(0,smoothNoise(x*0.006-90,z*0.006+32))*-2.7;}
export function soilFactor(x,z){return smoothNoise(x*0.021-15,z*0.021+40);}