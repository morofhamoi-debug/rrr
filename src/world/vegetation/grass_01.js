import * as THREE from 'three';
export function createGrassGeometry(){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-0.055,0,0,0.055,0,0,0.008,0.72,0,0,0,-0.05,0,0,0.05,0,0.68,0.008],3));g.computeVertexNormals();return g;
}
export function createGrassMaterial(){
 const m=new THREE.MeshStandardMaterial({color:0xffffff,side:THREE.DoubleSide,roughness:0.92,metalness:0});
 m.onBeforeCompile=(s)=>{
  s.uniforms.uTime={value:0};
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;');
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat sway=sin(uTime*1.45+instanceMatrix[3][0]*0.035+instanceMatrix[3][2]*0.027+position.y*2.1);\ntransformed.x+=sway*position.y*0.105;\ntransformed.z+=cos(uTime*1.1+instanceMatrix[3][2]*0.021)*position.y*0.06;\n#endif');
  m.userData.shader=s;
 };return m;
}