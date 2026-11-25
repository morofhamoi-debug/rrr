import * as THREE from 'three';
export class Sky{
 constructor(scene){
  this.scene=scene;this.mesh=new THREE.Mesh(new THREE.SphereGeometry(4200,32,20),new THREE.ShaderMaterial({
   side:THREE.BackSide,depthWrite:false,uniforms:{uDay:{value:0.72}},
   vertexShader:'varying vec3 vWorld; void main(){vWorld=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:'varying vec3 vWorld; uniform float uDay; void main(){float h=max(0.0,normalize(vWorld).y);vec3 horizon=mix(vec3(0.89,0.66,0.44),vec3(0.61,0.77,0.82),uDay);vec3 zenith=mix(vec3(0.045,0.085,0.13),vec3(0.19,0.43,0.68),uDay);vec3 col=mix(horizon,zenith,smoothstep(0.0,0.82,h));gl_FragColor=vec4(col,1.0);}'
  }));
  this.mesh.frustumCulled=false;this.mesh.renderOrder=-10;scene.add(this.mesh);
  this.sun=new THREE.Mesh(new THREE.SphereGeometry(18,20,16),new THREE.MeshBasicMaterial({color:0xffe0ad}));scene.add(this.sun);
 }
 update(camera,day){
  this.mesh.position.copy(camera.position);const angle=day/24*Math.PI*2-Math.PI*0.5;
  this.sun.position.set(camera.position.x+Math.cos(angle)*1200,Math.sin(angle)*950+220,camera.position.z-1000);
  const daylight=Math.max(0.08,Math.sin(angle)*0.5+0.5);this.mesh.material.uniforms.uDay.value=daylight;this.sun.visible=this.sun.position.y>0;
 }
}