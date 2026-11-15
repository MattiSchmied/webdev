// Short, curled pile built from twelve instanced cutout shells. Each strand has
// one stable root in UV space, a curved centreline and a tapered tip. Standard
// Three.js lighting and received shadows are retained on every shell.
export function addPlushPile(THREE, mesh, { length = .024, density = [240,180], layers = 12 } = {}) {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = mesh.geometry.index;
  geometry.attributes = { ...mesh.geometry.attributes };
  const shells = Float32Array.from({ length: layers }, (_,i)=>(i+1)/layers);
  geometry.setAttribute('pileLayer',new THREE.InstancedBufferAttribute(shells,1));
  geometry.instanceCount=layers;
  const material=mesh.material.clone();
  material.alphaTest=.32;
  material.transparent=false;
  material.depthWrite=true;
  material.onBeforeCompile=shader=>{
    shader.uniforms.pileLength={value:length};
    shader.uniforms.pileDensity={value:new THREE.Vector2(...density)};
    shader.vertexShader=`attribute float pileLayer;uniform float pileLength;
      varying vec2 vPileUv;varying float vPileLayer;\n`+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vPileUv=uv;vPileLayer=pileLayer;');
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n mvPosition.xyz+=normalize(transformedNormal)*pileLength*pileLayer;gl_Position=projectionMatrix*mvPosition;');
    shader.fragmentShader=`varying vec2 vPileUv;varying float vPileLayer;uniform vec2 pileDensity;
      float pileHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n`+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`
      vec2 textile=vPileUv*pileDensity;
      vec2 cell=floor(textile);
      float strand=pileHash(cell);
      vec2 root=vec2(pileHash(cell+17.2),pileHash(cell+91.7))*.28-.14;
      vec2 curl=vec2(sin(vPileLayer*5.+strand*6.283),cos(vPileLayer*4.+strand*6.283))*.14*vPileLayer;
      vec2 crossSection=fract(textile)-.5-root-curl;
      float radius=mix(.44,.055,pow(vPileLayer,1.25));
      float aa=max(.018,length(fwidth(textile))*.18);
      diffuseColor.a*=1.-smoothstep(radius-aa,radius+aa,length(crossSection));
      diffuseColor.rgb*=mix(.76,1.10,vPileLayer)*mix(.86,1.10,strand);
      #include <alphatest_fragment>
    `);
  };
  material.customProgramCacheKey=()=> 'short-curled-plush-pile-v1';
  const pile=new THREE.Mesh(geometry,material);
  pile.castShadow=false;pile.receiveShadow=true;pile.frustumCulled=false;
  mesh.add(pile);
  return pile;
}
