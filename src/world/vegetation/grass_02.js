import * as THREE from 'three';
export function grassColor(seed,moisture=0){
 const hue=0.235+(seed%100)/100*0.055,saturation=0.42+moisture*0.12,lightness=0.18+((seed*7)%17)/100+moisture*0.025;
 return new THREE.Color().setHSL(hue,saturation,lightness);
}
export function seededRandom(seed){let v=seed>>>0;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296;};}