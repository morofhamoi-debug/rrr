import { smoothNoise } from './field_01.js';
export function fieldHeight02(x,z){return Math.sin(x*0.004+z*0.0018)*Math.cos(z*0.0032)*3.2+smoothNoise(x*0.009+70,z*0.009-12)*2.2;}
export function fieldTint02(x,z){return smoothNoise(x*0.012+24,z*0.012-18);}