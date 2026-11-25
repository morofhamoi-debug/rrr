import * as THREE from 'three';

export function createGrassGeometry() {
  const positions = [];
  const uvs = [];
  const blade = (angle, height, width, lean) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    const rotate = (x, z) => [x * c - z * s, x * s + z * c];
    const left = rotate(-width * 0.5, 0);
    const right = rotate(width * 0.5, 0);
    const middle = rotate(lean * 0.35, height * 0.52);
    const tip = rotate(lean, height);
    positions.push(left[0],0,left[1],right[0],0,right[1],middle[0],height*0.52,middle[1]);
    positions.push(middle[0],height*0.52,middle[1],right[0],0,right[1],tip[0],height,tip[1]);
    uvs.push(0,0,1,0,0.5,0.52,0.5,0.52,1,0,0.5,1);
  };
  blade(0,0.9,0.13,0.09);
  blade(Math.PI/3,1.12,0.12,-0.06);
  blade(Math.PI*2/3,0.78,0.14,0.05);
  blade(Math.PI*0.85,1.02,0.1,-0.04);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.computeVertexNormals();
  return geometry;
}

export function createGrassMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    roughness: 0.91,
    metalness: 0,
    vertexColors: false
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uWind = { value: 0.8 };
    shader.uniforms.uWindDirection = { value: new THREE.Vector2(0.7,0.3) };
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\nuniform float uTime;\nuniform float uWind;\nuniform vec2 uWindDirection;\nvarying float vGrassHeight;'
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvGrassHeight=clamp(position.y/1.12,0.0,1.0);\nfloat gust=sin(uTime*1.65+instanceMatrix[3][0]*0.018+instanceMatrix[3][2]*0.021);\nfloat bend=gust*uWind*position.y*0.22;\ntransformed.x+=uWindDirection.x*bend;\ntransformed.z+=uWindDirection.y*bend;\n#endif'
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      '#include <common>\nvarying float vGrassHeight;'
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\n#ifdef USE_INSTANCING\ndiffuseColor.rgb*=mix(vec3(0.72,0.78,0.46),vec3(1.0,1.03,0.88),vGrassHeight);\n#endif'
    );
    material.userData.shader = shader;
  };
  return material;
}