import * as THREE from 'three';
export class Clouds{
 constructor(scene){
  this.group=new THREE.Group();this.group.name='distant-cloud-formations';this.clouds=[];
  const geometry=new THREE.SphereGeometry(1,14,10),material=new THREE.MeshStandardMaterial({color:0xe7e9e4,roughness:1,transparent:true,opacity:0.74,depthWrite:false});
  for(let i=0;i<18;i++){
   const cloud=new THREE.Group(),seed=i*17.23,count=3+i%4;
   for(let j=0;j<count;j++){const puff=new THREE.Mesh(geometry,material);puff.position.set(j*18-count*7,Math.sin(j*1.7+seed)*5,Math.cos(j*2.1)*12);puff.scale.set(24+(j%2)*12,8+(i%3)*3,13+(j%3)*4);cloud.add(puff);}
   cloud.position.set(Math.sin(seed)*1050,145+(i%5)*24,Math.cos(seed*0.7)*1150);this.group.add(cloud);this.clouds.push(cloud);
  }scene.add(this.group);
 }
 update(dt){for(const c of this.clouds){c.position.x+=dt*1.8;if(c.position.x>1350)c.position.x=-1350;}}
}