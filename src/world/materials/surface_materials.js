import * as THREE from 'three';
const cache=new Map();
function hash(x,y,s){const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n);}
function makeMaps(kind){
 const size=(window.matchMedia?.('(pointer: coarse)').matches||navigator.maxTouchPoints>0)?512:1024;
 const color=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4),hmap=new Float32Array(size*size);
 const asphalt=kind==='asphalt',earth=kind==='earth';
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,f=hash(x,y,17),m=Math.sin(x*.071+Math.sin(y*.021)*2.2)*.5+Math.cos(y*.063-Math.sin(x*.027)*1.8)*.35;
  const broad=Math.sin(x*.018+y*.012)*.5+Math.cos(y*.016-x*.01)*.5;
  const grain=(f-.5)*20+m*12+broad*15;let r,g,b,h,q;
  if(asphalt){
   const crack=(Math.abs(Math.sin(x*.027+Math.sin(y*.015)*3))<.018||Math.abs(Math.sin(y*.031+Math.sin(x*.019)*2))<.014)?-22:0;
   r=53+grain+crack;g=57+grain+crack;b=56+grain+crack;h=118+m*22+f*28+(crack<0?-24:0);q=192+f*50+m*8;
  }else if(earth){
   const pebble=f>.965?-28:0;r=105+grain+pebble;g=78+grain*.72+pebble*.65;b=49+grain*.45+pebble*.4;h=124+m*24+f*38+pebble;q=225+f*27;
  }else{
   const organic=Math.sin(x*.023+y*.034)*6;r=70+grain*.62+organic;g=91+grain+organic*1.4;b=43+grain*.36;h=112+m*24+f*32+broad*12;q=218+f*32;
  }
  color[i*4]=THREE.MathUtils.clamp(r,0,255);color[i*4+1]=THREE.MathUtils.clamp(g,0,255);color[i*4+2]=THREE.MathUtils.clamp(b,0,255);color[i*4+3]=255;
  for(let c=0;c<3;c++){rough[i*4+c]=THREE.MathUtils.clamp(q,0,255);height[i*4+c]=THREE.MathUtils.clamp(h,0,255);}rough[i*4+3]=height[i*4+3]=255;hmap[i]=h;
 }
 const normal=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const l=hmap[y*size+(x+size-1)%size],r=hmap[y*size+(x+1)%size],d=hmap[((y+size-1)%size)*size+x],u=hmap[((y+1)%size)*size+x];
  let nx=(l-r)*.035,ny=(d-u)*.035,nz=1;const len=Math.hypot(nx,ny,nz);nx/=len;ny/=len;nz/=len;
  const i=(y*size+x)*4;normal[i]=(nx*.5+.5)*255;normal[i+1]=(ny*.5+.5)*255;normal[i+2]=(nz*.5+.5)*255;normal[i+3]=255;
 }
 const texture=(data,colorSpace=THREE.NoColorSpace)=>{const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.colorSpace=colorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=16;t.needsUpdate=true;return t;};
 return {map:texture(color,THREE.SRGBColorSpace),roughnessMap:texture(rough),normalMap:texture(normal),bumpMap:texture(height)};
}
export function createSurfaceMaterial(kind){
 if(cache.has(kind))return cache.get(kind).clone();
 const mat=new THREE.MeshStandardMaterial({...makeMaps(kind),color:0xffffff,roughness:kind==='asphalt'?.92:.98,metalness:kind==='asphalt'?.025:0,bumpScale:kind==='asphalt'?.018:kind==='earth'?.055:.035,aoMapIntensity:.28});
 mat.normalScale.set(kind==='asphalt'?.42:.72,kind==='asphalt'?.42:.72);cache.set(kind,mat);return mat.clone();
}