import * as THREE from 'three';
import { createRibbon,createRoadMarkings } from './road_markings.js';
export function addNarrowRoad(scene,texture){
 const group=new THREE.Group();group.name='narrow-asphalt-road';
 const asphalt=new THREE.MeshStandardMaterial({map:texture,color:0x656c68,roughness:0.98});
 const points=[[-650,535],[-410,400],[-180,300],[40,180],[280,70],[510,125],[720,255]];
 group.add(createRibbon(points,7.2,new THREE.MeshStandardMaterial({color:0x777461,roughness:1}),0.12,125).mesh);
 group.add(createRibbon(points,5.6,asphalt,0.2,125).mesh);createRoadMarkings(group,points,5.6,false);
 group.userData.road={points,width:7.2};scene.add(group);return group;
}