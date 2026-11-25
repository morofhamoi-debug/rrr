export function smoothNoise(x,z){
 const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
 const ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
 const hash=(a,b)=>{const v=Math.sin(a*127.1+b*311.7+41.7)*43758.5453;return(v-Math.floor(v))*2-1;};
 const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);
 const top=a+(b-a)*ux,bottom=c+(d-c)*ux;return top+(bottom-top)*uz;
}
export function fieldHeight01(x,z){
 return Math.sin(x*0.0027+0.6)*3.7+Math.cos(z*0.0022-0.4)*3.1+
 Math.sin((x+z)*0.009)*1.35+Math.cos((x-z)*0.012)*0.8+
 smoothNoise(x*0.018,z*0.018)*1.2+smoothNoise(x*0.055,z*0.055)*0.28;
}