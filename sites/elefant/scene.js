import * as THREE from './vendor/three.module.min.js';
import { createWetGlass } from './wet-glass.js';
import { addPlushPile } from './plush-fur.js';

// All geometry, textures and animation are generated locally. No remote assets.
const stage = document.querySelector('#stage');
let needsRender = true;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setClearColor(0xffffff);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('white');
scene.fog = new THREE.Fog('white', 18, 36);
const camera = new THREE.PerspectiveCamera(36, 1, .1, 60);
const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
scene.add(new THREE.HemisphereLight(0xe8edf4, 0xa2988a, 2.5));
const key = new THREE.DirectionalLight(0xfff3e4, 2.8);
key.position.set(-4, 8, 6); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .5, far: 24 });
key.shadow.normalBias = .025; key.shadow.bias = -.0002; key.shadow.radius = 4;
scene.add(key);
const fill = new THREE.DirectionalLight(0xe8f3ff, 1.15); fill.position.set(5, 4, -3); scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x67615a, opacity: .19 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

let seed = 819;
function rand() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
const mix = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function skinTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c3c0ba'; ctx.fillRect(0, 0, 1024, 1024);
  // Short overlapping fibres: a soft stuffed animal rather than leathery skin.
  for (let i = 0; i < 110000; i++) {
    const x = rand()*1024, y = rand()*1024, light = rand() > .5;
    ctx.strokeStyle = light ? 'rgba(255,249,235,.21)' : 'rgba(68,65,61,.15)';
    ctx.lineWidth = .45 + rand()*.65; ctx.beginPath(); ctx.moveTo(x,y);
    ctx.quadraticCurveTo(x+rand()*3-1.5,y-1,x+rand()*2-1,y-2-rand()*3);ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2); tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}
const texture = skinTexture();
const skin = new THREE.MeshStandardMaterial({ color: 0x99958e, map: texture, bumpMap: texture, bumpScale: .047, roughness: .93 });
const innerSkin = skin.clone(); innerSkin.color.set(0x8f8980); innerSkin.side = THREE.DoubleSide;
const darkSkin = skin.clone(); darkSkin.color.set(0x66615c);
const ivory = new THREE.MeshStandardMaterial({ color: 0xe5dfce, roughness: .35 });
const black = new THREE.MeshPhysicalMaterial({ color: 0x15100d, roughness: .13, clearcoat: 1 });
const elephant = new THREE.Group(); scene.add(elephant);
const torso = new THREE.Group(); elephant.add(torso);
const sphere = new THREE.SphereGeometry(1, 64, 48);
function oval(parent, pos, scale, material = skin) {
  const mesh = new THREE.Mesh(sphere, material); mesh.position.set(...pos); mesh.scale.set(...scale);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function plush(mesh, options) { addPlushPile(THREE,mesh,options); return mesh; }
function tube(points, radius, material, parent, segments = 48, closed = false) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>V(...p)),closed);
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,8,closed),material);
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
const thread=skin.clone(); thread.color.set(0x7d776e); thread.bumpScale=.01;
const body=plush(oval(torso,[0,1.79,-.12],[.77,1.07,.61]),{density:[270,230],length:.028});
oval(torso,[0,2.53,-.01],[.53,.48,.48]);
const head=new THREE.Group();head.position.set(0,3.04,.13);torso.add(head);
const skull=oval(head,[0,.06,.02],[.83,.86,.74]);skull.geometry=sphere.clone();
const skullVertices=skull.geometry.attributes.position;
for(let i=0;i<skullVertices.count;i++) {
  const x=skullVertices.getX(i), y=skullVertices.getY(i), z=skullVertices.getZ(i);
  skullVertices.setX(i,x*(1+.10*(1-y)*.5));
  skullVertices.setZ(i,z*(1+Math.max(0,z)*.12*Math.exp(-Math.pow((y+.3)*2,2))));
}
skull.geometry.computeVertexNormals();plush(skull,{density:[320,230],length:.025});
function faceZ(x,y) {
  const ny=(y-.06)/.86, nx=x/(.83*(1+.10*(1-ny)*.5));
  const nz=Math.sqrt(Math.max(.01,1-nx*nx-ny*ny));
  return .02+.74*nz*(1+nz*.12*Math.exp(-Math.pow((ny+.3)*2,2)));
}
const eyes=[],brows=[];
const eyeSocket=skin.clone();eyeSocket.color.set(0x817a70);
const eyeWhite=new THREE.MeshStandardMaterial({color:0xb7afa1,roughness:.55});
const iris=new THREE.MeshPhysicalMaterial({color:0x33271f,roughness:.14,clearcoat:1});
const catchlight=new THREE.MeshBasicMaterial({color:0xfff8e8});
for(const side of [-1,1]) {
  const x=side*.415,y=.115;
  const eye=new THREE.Group();eye.position.set(x,y,faceZ(x,y)+.004);eye.rotation.y=side*.26;head.add(eye);eyes.push(eye);
  oval(eye,[0,0,0],[.119,.153,.034],eyeSocket);
  oval(eye,[0,.003,.027],[.099,.130,.027],eyeWhite);
  oval(eye,[-side*.009,-.006,.045],[.085,.112,.041],iris);
  oval(eye,[-side*.008,-.008,.073],[.061,.089,.023],black);
  oval(eye,[-.026,.041,.092],[.021,.026,.007],catchlight);
  oval(eye,[.027,-.038,.094],[.008,.010,.004],catchlight);
  const browPoints=[[side*.285,.322],[side*.41,.383],[side*.54,.318]].map(([bx,by])=>[bx,by,faceZ(bx,by)+.012]);
  brows.push(tube(browPoints,.013,thread,head,24));
}
// A curved, fabric-lined smile follows the actual cheek, rather than floating
// in front of the head. The trunk naturally hides its central upper edge.
const mouthShape=new THREE.Shape();mouthShape.moveTo(-.42,-.34);
mouthShape.quadraticCurveTo(.01,-.49,.43,-.325);
mouthShape.quadraticCurveTo(.26,-.605,.025,-.59);
mouthShape.quadraticCurveTo(-.25,-.605,-.42,-.34);
const mouthOutline=new THREE.ShapeGeometry(mouthShape,32), mouthPositions=[];
const mouthFlat=mouthOutline.index?mouthOutline.toNonIndexed():mouthOutline;
const mouthPoints=mouthFlat.attributes.position;
function mouthTriangle(a,b,c,depth){
  if(depth){
    const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);
    mouthTriangle(a,ab,ca,depth-1);mouthTriangle(ab,b,bc,depth-1);
    mouthTriangle(ca,bc,c,depth-1);mouthTriangle(ab,bc,ca,depth-1);
  } else for(const p of [a,b,c]) mouthPositions.push(p.x,p.y,faceZ(p.x,p.y)+.035);
}
for(let i=0;i<mouthPoints.count;i+=3)mouthTriangle(
  new THREE.Vector2(mouthPoints.getX(i),mouthPoints.getY(i)),
  new THREE.Vector2(mouthPoints.getX(i+1),mouthPoints.getY(i+1)),
  new THREE.Vector2(mouthPoints.getX(i+2),mouthPoints.getY(i+2)),3);
const mouthGeometry=new THREE.BufferGeometry();mouthGeometry.setAttribute('position',new THREE.Float32BufferAttribute(mouthPositions,3));mouthGeometry.computeVertexNormals();
mouthOutline.dispose();if(mouthFlat!==mouthOutline)mouthFlat.dispose();
const mouthMaterial=new THREE.MeshStandardMaterial({color:0x66493a,roughness:1});
head.add(new THREE.Mesh(mouthGeometry,mouthMaterial));
const tongue=oval(head,[.035,-.548,faceZ(.035,-.548)+.055],[.135,.033,.009],new THREE.MeshStandardMaterial({color:0xba7e5d,roughness:1}));
for(const side of [-1,1]) {
  const pts=[[side*.425,-.33],[side*.47,-.285],[side*.475,-.235]].map(([x,y])=>[x,y,faceZ(x,y)+.032]);
  tube(pts,.0085,thread,head,20);
}
// Rounded stuffed ears with a truly recessed cup, a rolled edge and gray pile.
const ears=[];
for(const side of [-1,1]) {
  const pivot=new THREE.Group();pivot.position.set(side*.64,.07,-.12);head.add(pivot);ears.push(pivot);
  const ear=new THREE.Group();ear.position.x=side*.43;pivot.add(ear);
  const g=new THREE.SphereGeometry(1,64,40),p=g.attributes.position;
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r2=x*x+y*y;
    const taper=.91+.09*smooth(-.8,.6,y);
    p.setXYZ(i,x*.61*taper,y*.74-.035*(1-y*y), z>=0?.022*z+.16*r2:-.125*Math.abs(z)+.16*r2);
  }
  g.computeVertexNormals();
  const shell=new THREE.Mesh(g,innerSkin);shell.castShadow=true;shell.receiveShadow=true;ear.add(shell);
  plush(shell,{density:[210,190],length:.020});
  const rim=[];
  for(let i=0;i<80;i++) {
    const a=i/80*Math.PI*2,y=Math.sin(a),x=Math.cos(a),taper=.91+.09*smooth(-.8,.6,y);
    rim.push([x*.61*taper,y*.74-.035*(1-y*y),.162]);
  }
  plush(tube(rim,.033,skin,ear,100,true),{density:[290,20],length:.014});
}
// A single continuous padded profile per limb avoids ball-shaped joints.
function paddedLimb(parent,profile,side,foot=false) {
  const g=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),48);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++) {
    const y=p.getY(i);
    p.setX(i,p.getX(i)+(foot?0:side*(-y)*.17));
    if(foot)p.setZ(i,p.getZ(i)+smooth(.50,1.02,-y)*.14);
  }
  g.computeVertexNormals();const mesh=new THREE.Mesh(g,skin);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  plush(mesh,{density:foot?[190,180]:[190,170],length:.025});return mesh;
}
const legs=[],arms=[];
for(const side of [-1,1]) {
  const leg=new THREE.Group();leg.position.set(side*.405,1.15,-.05);torso.add(leg);legs.push(leg);
  paddedLimb(leg,[[0,-1.145],[.23,-1.145],[.34,-1.12],[.39,-1.04],[.40,-.92],[.36,-.78],[.33,-.62],[.35,-.36],[.355,-.16],[.30,.02],[.16,.13],[0,.16]],side,true);
  const ankle=[];
  for(let i=0;i<64;i++){const a=i/64*Math.PI*2;ankle.push([Math.cos(a)*.376,-.80,Math.sin(a)*.376+.10]);}
  tube(ankle,.0055,thread,leg,72,true);
  for(let i=0;i<3;i++){
    const x=(i-1)*.17;
    tube([[x,-1.08,.465],[x,-1.025,.512],[x,-.96,.523]],.005,thread,leg,12);
  }
  const arm=new THREE.Group();arm.position.set(side*.70,2.47,-.04);torso.add(arm);arms.push(arm);
  paddedLimb(arm,[[0,-1.02],[.13,-1.0],[.24,-.94],[.295,-.83],[.30,-.71],[.28,-.56],[.265,-.34],[.26,-.12],[.21,.065],[.11,.14],[0,.16]],side);
  const cuff=[];
  for(let i=0;i<64;i++){const a=i/64*Math.PI*2;cuff.push([side*.13+Math.cos(a)*.297,-.77,Math.sin(a)*.297]);}
  tube(cuff,.005,thread,arm,72,true);
}
// Subtle centre stitching makes the toy read as sewn fabric, with no belly patch.
const bellySeam=[];
for(let i=0;i<=28;i++){
  const y=1.05+i/28*1.34,z=-.12+.61*Math.sqrt(Math.max(0,1-Math.pow((y-1.79)/1.07,2)));
  bellySeam.push([0,y,z+.009]);
}
tube(bellySeam,.005,thread,torso,48);
for(let i=0;i<17;i++){
  const y=1.15+i*.069,z=-.12+.61*Math.sqrt(Math.max(0,1-Math.pow((y-1.79)/1.07,2)));
  tube([[-.012,y-.005,z+.012],[.012,y+.005,z+.012]],.0025,thread,torso,3);
}
const tail=new THREE.Group();tail.position.set(0,1.4,-.66);torso.add(tail);
plush(tube([[0,0,0],[.16,-.16,-.15],[.21,-.42,-.17],[.18,-.60,-.15]],.055,skin,tail),{density:[30,120],length:.021});
plush(oval(tail,[.18,-.63,-.15],[.085,.15,.08]),{density:[45,60],length:.028});

// Continuous tapered trunk mesh. Parallel transport keeps its cross sections stable.
const trunkSegments = 88, trunkSides = 28;
const trunkGeometry = new THREE.BufferGeometry();
const trunkPositions = new Float32Array((trunkSegments + 1) * (trunkSides + 1) * 3);
const trunkUV = new Float32Array((trunkSegments + 1) * (trunkSides + 1) * 2), trunkIndex = [];
for (let i = 0; i <= trunkSegments; i++) for (let j = 0; j <= trunkSides; j++) {
  const n = i * (trunkSides + 1) + j; trunkUV[n * 2] = j / trunkSides; trunkUV[n * 2 + 1] = i / trunkSegments * 2;
  if (i < trunkSegments && j < trunkSides) trunkIndex.push(n, n + 1, n + trunkSides + 1, n + 1, n + trunkSides + 2, n + trunkSides + 1);
}
trunkGeometry.setAttribute('position', new THREE.BufferAttribute(trunkPositions, 3).setUsage(THREE.DynamicDrawUsage));
trunkGeometry.setAttribute('uv', new THREE.BufferAttribute(trunkUV, 2)); trunkGeometry.setIndex(trunkIndex);
const trunk = new THREE.Mesh(trunkGeometry, skin); trunk.frustumCulled = false; trunk.castShadow = true; trunk.receiveShadow = true; head.add(trunk);trunkGeometry.computeVertexNormals();plush(trunk,{density:[140,160],length:.019});
const tip = new THREE.Group(); head.add(tip);
plush(oval(tip, [0, 0, 0], [.133, .12, .045]),{density:[55,50],length:.012});
for (const side of [-1, 1]) oval(tip, [side * .046, 0, .043], [.025, .034, .010], darkSkin);
oval(tip, [0, .09, .01], [.038, .055, .045]);
const rest = [[0,-.01,.72],[0,-.38,1.06],[.12,-.70,1.34],[.39,-.55,1.56],[.54,-.20,1.62]];
const down = [[0, -.01, .68], [0, -.6, .99], [.08, -1.5, 1.09], [.12, -2.4, 1.30], [.04, -2.96, 1.60]];
const aim = [[0, -.01, .68], [0, -.34, 1.09], [0, -.48, 1.53], [0, -.22, 1.97], [0, .12, 2.37]];
const curvePoints = rest.map(p => V(...p)); const trunkCurve = new THREE.CatmullRomCurve3(curvePoints);
const up = V(0, 1, 0), axis = new THREE.Vector3(), binormal = new THREE.Vector3(), point = new THREE.Vector3(), tangent = new THREE.Vector3();
function animateTrunk(t, lower, raise, spray) {
  const suck = smooth(7.7, 8.1, t) * (1 - smooth(10.1, 10.5, t));
  for (let i = 0; i < 5; i++) {
    const p = curvePoints[i]; p.set(...rest[i]); p.lerp(V(...down[i]), lower); p.lerp(V(...aim[i]), raise);
    const f = i / 4;
    p.x += Math.sin(t * 2.3 - f * 2) * .055 * f * (1 - lower) * (1 - raise);
    p.y += Math.sin(t * 13 - f * 6) * .027 * f * suck;
    p.z += Math.sin(t * 11 - f * 8) * .035 * f * suck;
    if (spray) p.x += Math.sin(t * 22 - f * 2) * .018 * f;
  }
  axis.set(1,0,0);
  for (let i = 0; i <= trunkSegments; i++) {
    const u = i / trunkSegments; trunkCurve.getPoint(u, point); trunkCurve.getTangent(u, tangent).normalize();
    axis.addScaledVector(tangent,-axis.dot(tangent)).normalize(); binormal.crossVectors(tangent,axis).normalize();
    const r = mix(.30, .12, Math.pow(u, .7)) * (1 + .004 * Math.sin(u * Math.PI * 72)) * (1 - .04 * suck * Math.sin(t * 11 - u * 18));
    for (let j = 0; j <= trunkSides; j++) {
      const angle = j / trunkSides * Math.PI * 2, k = (i * (trunkSides + 1) + j) * 3;
      const a = Math.cos(angle) * r, b = Math.sin(angle) * r;
      trunkPositions[k] = point.x + axis.x * a + binormal.x * b;
      trunkPositions[k + 1] = point.y + axis.y * a + binormal.y * b;
      trunkPositions[k + 2] = point.z + axis.z * a + binormal.z * b;
    }
  }
  trunkGeometry.attributes.position.needsUpdate = true; trunkGeometry.computeVertexNormals();
  trunkCurve.getPoint(1, tip.position); trunkCurve.getTangent(1, tangent); tip.quaternion.setFromUnitVectors(V(0, 0, 1), tangent.normalize());
}

// Water emitted in world space; droplets fly toward the actual camera, not upward.
const particleCount = 6200, particlePositions = new Float32Array(particleCount * 3), particleSizes = new Float32Array(particleCount);
const particles = Array.from({ length: particleCount }, () => ({ age: 10, life: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), size: .03 }));
const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
pg.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1).setUsage(THREE.DynamicDrawUsage));
const waterMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
  uniforms: { pixelRatio: { value: 1 }, nozzleScreen: { value: new THREE.Vector2() } },
  vertexShader: `attribute float size; uniform float pixelRatio;uniform vec2 nozzleScreen;
  varying float vDepth;varying vec2 streak;
  void main(){vec4 p=modelViewMatrix*vec4(position,1.);vDepth=-p.z;
    gl_Position=projectionMatrix*p;
    streak=normalize(gl_Position.xy/max(.1,gl_Position.w)-nozzleScreen+vec2(.0001));
    gl_PointSize=clamp(size*520.*pixelRatio/max(.2,-p.z),0.,100.);}`,
  fragmentShader: `varying float vDepth;varying vec2 streak;
  void main(){vec2 p=gl_PointCoord*2.-1.;
    float rush=1.-smoothstep(.4,4.,vDepth);
    vec2 q=vec2(dot(p,streak),dot(p,vec2(-streak.y,streak.x)));
    q.y*=1.+rush*2.4;float r=dot(q,q);if(r>1.)discard;
    float edge=pow(r,4.);float light=pow(max(0.,1.-length(q-vec2(-.18,.30))*1.65),6.);
    gl_FragColor=vec4(vec3(.62,.72,.77)+light*.7-edge*.1,(.11+edge*.08+light*.45)*smoothstep(1.,.68,r));}` });
const sprayPoints = new THREE.Points(pg, waterMaterial); sprayPoints.frustumCulled = false; scene.add(sprayPoints);
const nozzle = new THREE.Vector3(), direction = new THREE.Vector3(); let nextParticle = 0, emission = 0;
// A compact liquid core breaks into three oscillating filaments and airborne spray.
const jetMaterial = new THREE.MeshPhongMaterial({ color: 0xbcd6df, specular: 0xffffff, shininess: 110, transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide });
const jets = Array.from({length:3}, () => {
  const g = new THREE.CylinderGeometry(1,1,1,8,28,true);
  const m = new THREE.Mesh(g,jetMaterial); m.frustumCulled=false; scene.add(m); return m;
});
const jetRight = new THREE.Vector3(), jetUp = new THREE.Vector3();
function updateJet(strength) {
  jetRight.crossVectors(direction,up).normalize(); jetUp.crossVectors(jetRight,direction).normalize();
  for(let j=0;j<jets.length;j++) {
    const mesh=jets[j]; mesh.visible=strength>.01; if(!mesh.visible)continue;
    const pos=mesh.geometry.attributes.position;
    for(let ring=0;ring<=28;ring++) {
      const u=ring/28, length=2.4+j*.55, phase=time*32-j*2;
      const radius=(.025*Math.pow(1-u,.7)+.003)*(1+Math.sin(u*35-phase)*.22)*strength;
      const wobble=u*u*.16;
      for(let a=0;a<=8;a++) {
        const angle=a/8*Math.PI*2;
        const x=Math.cos(angle)*radius+Math.sin(u*14-phase+j)*wobble;
        const y=Math.sin(angle)*radius+Math.cos(u*11-phase)*wobble;
        const i=ring*9+a;
        pos.setXYZ(i,nozzle.x+direction.x*u*length+jetRight.x*x+jetUp.x*y,
          nozzle.y+direction.y*u*length+jetRight.y*x+jetUp.y*y-u*u*.15,
          nozzle.z+direction.z*u*length+jetRight.z*x+jetUp.z*y);
      }
    }
    pos.needsUpdate=true;mesh.geometry.computeVertexNormals();
  }
}
function spray(dt, strength) {
  tip.getWorldPosition(nozzle); direction.subVectors(camera.position, nozzle).normalize();
  const projected=nozzle.clone().project(camera);
  waterMaterial.uniforms.nozzleScreen.value.set(projected.x,projected.y);
  updateJet(strength);
  if (strength > 0) {
    emission += dt * 3000 * strength;
    while (emission >= 1) {
      emission--; const p = particles[nextParticle++ % particleCount]; p.age = 0; p.life = .7 + rand() * .6;
      p.p.copy(nozzle); p.v.copy(direction).multiplyScalar(camera.position.distanceTo(nozzle)/(.36+rand()*.20));
      p.v.x += (rand() - .5) * (2.1 + strength * 4); p.v.y += (rand() - .45) * 4;
      p.size = .009 + rand() ** 3 * .068;
    }
  }
  for (let i = 0; i < particleCount; i++) {
    const p = particles[i]; p.age += dt;
    if (p.age < p.life) { p.v.y -= dt * 3.8; p.p.addScaledVector(p.v, dt); particlePositions.set(p.p.toArray(), i * 3); particleSizes[i] = p.size * smooth(0, .04, p.age) * (1 - smooth(p.life * .7, p.life, p.age)); }
    else { particlePositions[i * 3 + 1] = -100; particleSizes[i] = 0; }
  }
  pg.attributes.position.needsUpdate = pg.attributes.size.needsUpdate = true;
}

const wetGlass = createWetGlass(THREE,renderer,target.texture);
const post = wetGlass.post;
let wetness = 0, wiped = false, splashSeeded = false;
let width, height;
function resize() {
  needsRender = true;
  width = stage.clientWidth; height = stage.clientHeight;
  renderer.setSize(width, height); camera.aspect = width / height;
  const distance = Math.max(9.2, 6.6 / camera.aspect);
  camera.position.set(0, 2.8, distance); camera.lookAt(0, 2.05, 0); camera.updateProjectionMatrix();
  target.setSize(Math.round(width * renderer.getPixelRatio()), Math.round(height * renderer.getPixelRatio()));
  wetGlass.resize(target.width, target.height); waterMaterial.uniforms.pixelRatio.value = renderer.getPixelRatio();
}
window.addEventListener('resize', resize); resize();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let time = reducedMotion ? 5.8 : 0, paused = reducedMotion, previous = performance.now(), animationId;
const pauseButton = document.querySelector('#pause');
function updatePause() { pauseButton.textContent = paused ? '▷' : 'Ⅱ'; pauseButton.setAttribute('aria-label', paused ? 'Animation abspielen' : 'Animation pausieren'); pauseButton.title = paused ? 'Abspielen' : 'Pause'; }
function reset() {
  needsRender = true;
  time = 0; wetness = 0; wiped = false; splashSeeded = false; paused = false; emission = 0; wetGlass.reset();
  particles.forEach(p => { p.age = 10; }); document.body.classList.remove('wet'); document.querySelector('#status').textContent = 'Die Szene beginnt.'; updatePause();
}
document.querySelector('#replay').addEventListener('click', reset);
pauseButton.addEventListener('click', () => { paused = !paused; needsRender = true; updatePause(); });
document.querySelector('#wipe').addEventListener('click', () => { needsRender = true; wiped = true; wetness = 0; post.uniforms.wet.value = 0; document.body.classList.remove('wet'); document.querySelector('#status').textContent = 'Die Scheibe ist wieder trocken.'; });
document.addEventListener('visibilitychange', () => { previous = performance.now(); });
updatePause();
function frame(now) {
  animationId = requestAnimationFrame(frame);
  const dt = document.hidden || paused ? 0 : Math.min((now - previous) / 1000, .075); previous = now; time += dt;
  if (paused && !needsRender) return;
  needsRender = false;
  const t = time;
  const departing=smooth(20.6,21.4,t)*(1-smooth(25.9,26.7,t));
  const walk = Math.max(1-smooth(4.2,5.6,t),departing), arrive = smooth(.5,5.6,t);
  // Constant-velocity middle section; eased acceleration and deceleration.
  const travel = smooth(.5, 5.8, t);
  const offscreen = Math.max(5.5, camera.aspect * camera.position.z * .43);
  const exit=smooth(21.0,26.5,t);
  elephant.position.x=mix(-offscreen,0,travel)+offscreen*exit;
  elephant.rotation.y=mix(1.12,0,smooth(3.9,6.3,t))+1.45*smooth(20.0,21.3,t);
  elephant.visible=t<27;
  torso.position.y = Math.abs(Math.sin(t * 4.7)) * .095 * walk + Math.sin(t * 1.5) * .012 * arrive;
  torso.rotation.z = Math.sin(t * 4.7) * .055 * walk;
  torso.rotation.x = .025 * smooth(6.5, 7.8, t) * (1 - smooth(10.2, 11.7, t));
  legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 4.7 + i * Math.PI) * .33 * walk; l.position.y = 1.15 + Math.max(0, Math.sin(t * 4.7 + i * Math.PI)) * .07 * walk; });
  arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 4.7 + i * Math.PI + Math.PI) * .2 * walk; a.rotation.z = (i ? -1 : 1) * .02 * Math.sin(t * 1.5); });
  const hello = smooth(5.3,5.9,t)*(1-smooth(6.4,6.9,t));
  const giggle = smooth(14.6,15.3,t)*(1-smooth(17.5,18.5,t));
  head.rotation.z = -.10*hello + Math.sin(t*8)*.045*giggle;
  head.position.y = 3.04 + Math.sin(t*9)*.025*giggle;
  head.rotation.y = Math.sin(t*.8)*.035*arrive;
  eyes.forEach((eye,i)=>{
    const naturalBlink=Math.pow(Math.max(0,Math.cos(t*1.31+i*.015)),55);
    const wink=i===0?smooth(15.65,15.78,t)*(1-smooth(15.98,16.15,t)):0;
    const blink=Math.max(naturalBlink,wink);
    eye.scale.y=1-.91*blink;
  });
  const goodbye=smooth(18.9,19.25,t)*(1-smooth(19.9,20.2,t));
  arms[1].rotation.z += (-.95+Math.sin(t*10)*.09)*goodbye -1.15*hello + Math.sin(t*9)*.08*hello - .23*giggle;
  arms[0].rotation.z += .17*giggle;
  head.rotation.x = .075 * smooth(6.4, 7.8, t) * (1 - smooth(10.4, 11.7, t)) - .035 * smooth(11, 12.2, t);
  ears.forEach((ear, i) => { const side = i ? 1 : -1; ear.rotation.y = side * (.10 + Math.sin(t * 1.8 + i * .2) * .075 + smooth(11.7, 12.2, t) * .12 * (1 - smooth(14.3, 15.5, t))); ear.rotation.z = side * Math.sin(t * 1.4) * .018; });
  tail.rotation.z = Math.sin(t * 2) * .22;
  const lower = smooth(6.2, 7.8, t), raise = smooth(10.3, 12.1, t);
  const strength = smooth(12.1, 12.35, t) * (1 - smooth(13.8, 14.4, t));
  animateTrunk(t, lower * (1 - smooth(14.8, 17, t)), raise * (1 - smooth(14.8, 17, t)), strength > 0);
  elephant.updateMatrixWorld(true); spray(dt, strength);
  if (t >= 12.55 && !splashSeeded) { splashSeeded = true; document.body.classList.add('wet'); document.querySelector('#status').textContent = 'Der Elefant hat die Scheibe nass gespritzt.'; }
  const desiredWet = wiped ? 0 : smooth(12.55, 12.70, t);
  wetness = mix(wetness, desiredWet, dt ? Math.min(1, dt * (wiped ? 4 : 12)) : 0);
  const impact=smooth(12.55,12.70,t)*(1-smooth(12.8,13.5,t));
  renderer.setRenderTarget(target); renderer.render(scene, camera); wetGlass.render(t,wetness,impact);
  document.querySelector('#loading').hidden = true;
}
renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(animationId); document.querySelector('#error').hidden = false; });
renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());
requestAnimationFrame(frame);
// Useful for deterministic visual verification, without adding controls to the scene.
if (new URLSearchParams(location.search).has('frame')) {
  time = clamp(Number(new URLSearchParams(location.search).get('frame')) || 0, 0, 60); paused = true;
  if (time >= 12.55) { splashSeeded = true; wetness = 1; document.body.classList.add('wet'); }
  if (time > 12.1 && time < 14.4) {
    animateTrunk(time, 1, 1, true); elephant.position.x=0; elephant.updateMatrixWorld(true);
    for(let i=0;i<24;i++) spray(1/60,1);
  }
  updatePause();
}
