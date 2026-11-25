import * as THREE from 'three';
import { createRibbon,createRoadMarkings } from './road_markings.js';
export function addMainRoad(scene,texture){
 const group=new THREE.Group();group.name='wide-asphalt-road';
 const asphalt=new THREE.MeshStandardMaterial({map:texture,color:0x777a74,roughness:0.94,metalness:0.02});
 const shoulder=new THREE.MeshStandardMaterial({color:0x807c68,roughness:1});
 const points=[[-760,365],[-520,290],[-260,195],[-20,88],[210,16],[470,-55],[760,-142]];
 group.add(createRibbon(points,18,shoulder,0.11,140).mesh);group.add(createRibbon(points,14.2,asphalt,0.2,140).mesh);
 createRoadMarkings(group,points,14.2,true);group.userData.road={points,width:18};scene.add(group);return group;
}