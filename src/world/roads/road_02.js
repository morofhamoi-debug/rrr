import * as THREE from 'three';
import { createRibbon } from './road_markings.js';
export function addSecondaryRoad(scene,texture){
 const group=new THREE.Group();group.name='secondary-asphalt-road';
 const asphalt=new THREE.MeshStandardMaterial({map:texture,color:0x686f6c,roughness:0.96});
 const shoulder=new THREE.MeshStandardMaterial({color:0x817b66,roughness:1});
 const points=[[-710,-455],[-470,-385],[-230,-278],[10,-195],[260,-102],[520,-42],[730,-8]];
 group.add(createRibbon(points,12,shoulder,0.11,130).mesh);group.add(createRibbon(points,8.2,asphalt,0.2,130).mesh);
 group.userData.road={points,width:12};scene.add(group);return group;
}