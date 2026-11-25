import * as THREE from 'three';
import { createRibbon } from './road_markings.js';
export function addDirtRoad(scene){
 const group=new THREE.Group();group.name='dirt-road';
 const earth=new THREE.MeshStandardMaterial({color:0x796a50,roughness:1}),track=new THREE.MeshStandardMaterial({color:0x655940,roughness:1});
 const points=[[-760,-100],[-520,-40],[-320,18],[-95,70],[110,160],[310,305],[540,435],[760,505]];
 group.add(createRibbon(points,7.4,earth,0.13,140).mesh);group.add(createRibbon(points,4.8,track,0.18,140,-1.15).mesh);group.add(createRibbon(points,4.8,track,0.18,140,1.15).mesh);
 group.userData.road={points,width:7.4};scene.add(group);return group;
}