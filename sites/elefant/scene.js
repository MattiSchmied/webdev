import * as THREE from './vendor/three.module.min.js';
import { createWetGlass } from './wet-glass.js';

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
scene.add(new THREE.HemisphereLight(0xe8f2ff, 0xb0a89e, 3.2));
const key = new THREE.DirectionalLight(0xfff5e8, 3.2);
key.position.set(-4, 8, 6); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .5, far: 24 });
key.shadow.normalBias = .025; key.shadow.bias = -.0002; key.shadow.radius = 4;
scene.add(key);
const fill = new THREE.DirectionalLight(0xe8f3ff, 1.5); fill.position.set(5, 4, -3); scene.add(fill);
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
const skin = new THREE.MeshStandardMaterial({ color: 0x96938e, map: texture, bumpMap: texture, bumpScale: .027, roughness: .93 });
const innerSkin = skin.clone(); innerSkin.color.set(0xbba6a1); innerSkin.side = THREE.DoubleSide;
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
const fuzzMaterial = new THREE.LineBasicMaterial({ color: 0xb1aaa0, transparent: true, opacity: .17, depthWrite: false });
function fuzz(mesh, count) {
  const points = [];
  for (let i=0;i<count;i++) {
    const y=rand()*2-1, a=rand()*Math.PI*2, r=Math.sqrt(1-y*y);
    const x=Math.cos(a)*r, z=Math.sin(a)*r, length=.007+rand()*.013;
    points.push(x*1.003,y*1.003,z*1.003,x*(1+length),y*(1+length),z*(1+length));
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  mesh.add(new THREE.LineSegments(g,fuzzMaterial));
}
const body = oval(torso, [0, 1.73, -.12], [.79, 1.06, .63]); fuzz(body,4200);
oval(torso, [0, 2.51, .02], [.57, .54, .52]);
const bellyMaterial=skin.clone(); bellyMaterial.color.set(0xc6bfb2);
oval(torso,[0,1.63,.43],[.56,.77,.16],bellyMaterial);
const head = new THREE.Group(); head.position.set(0, 3.04, .13); torso.add(head);
const skull = oval(head, [0, .06, .02], [.88, .89, .73]); fuzz(skull,5600);
oval(head, [0, -.38, .18], [.64, .43, .55]);
const eyes = [], brows = [];
const eyeWhite=new THREE.MeshStandardMaterial({color:0xfff7e8,roughness:.28});
const iris=new THREE.MeshPhysicalMaterial({color:0x473426,roughness:.12,clearcoat:1});
const catchlight=new THREE.MeshBasicMaterial({color:0xffffff});
const blush=new THREE.MeshStandardMaterial({color:0xd5a89d,roughness:1,transparent:true,opacity:.40});
const mouthMaterial=new THREE.MeshStandardMaterial({color:0x684537,roughness:.95});
for (const side of [-1, 1]) {
  oval(head,[side*.55,-.25,.54],[.23,.19,.13]);
  oval(head,[side*.59,-.23,.643],[.115,.055,.022],blush);
  const eye = new THREE.Group(); eye.position.set(side*.405,.09,.65); eye.rotation.y=side*.15; head.add(eye);eyes.push(eye);
  oval(eye,[0,0,0],[.18,.224,.092],eyeWhite);
  oval(eye,[-side*.018,-.012,.075],[.132,.175,.065],iris);
  oval(eye,[-side*.016,-.012,.122],[.091,.139,.035],black);
  oval(eye,[-.038,.065,.153],[.039,.044,.012],catchlight);
  oval(eye,[.044,-.065,.151],[.015,.018,.007],catchlight);
  const brow=tube([[side*.23,.365,.64],[side*.39,.435,.65],[side*.57,.355,.58]],.023,darkSkin,head,24);brows.push(brow);
}
// Open crescent smile, tucked under the trunk, with a small warm tongue.
const mouthShape=new THREE.Shape();mouthShape.moveTo(-.43,-.34);
mouthShape.quadraticCurveTo(0,-.57,.43,-.34);
mouthShape.quadraticCurveTo(.30,-.69,0,-.65);mouthShape.quadraticCurveTo(-.28,-.68,-.43,-.34);
const mouth=new THREE.Mesh(new THREE.ShapeGeometry(mouthShape,32),mouthMaterial);mouth.position.z=.683;head.add(mouth);
oval(head,[.04,-.603,.696],[.19,.047,.015],new THREE.MeshStandardMaterial({color:0xd59580,roughness:.8}));
tube([[-.44,-.32,.675],[-.49,-.28,.64],[-.50,-.22,.62]],.017,darkSkin,head,18);
tube([[.44,-.32,.675],[.49,-.28,.64],[.50,-.22,.62]],.017,darkSkin,head,18);
// Thick rounded ears, recessed warm centres and a soft rolled edge.
const ears = [];
for (const side of [-1, 1]) {
  const pivot = new THREE.Group(); pivot.position.set(side*.65,.11,-.12); head.add(pivot); ears.push(pivot);
  const outer=oval(pivot,[side*.43,0,0],[.57,.75,.19]); fuzz(outer,1700);
  const inset=oval(pivot,[side*.44,-.015,.145],[.445,.607,.075],innerSkin);fuzz(inset,900);
}
// A tiny unruly tuft gives the silhouette a softer, handmade character.
for(let i=0;i<7;i++) {
  const x=(i-3)*.035;
  tube([[x,.87,.06],[x-.035,.99+rand()*.05,.10],[x+.035,1.00+rand()*.05,.15]],.012,skin,head,12);
}
const legs = [], arms = [];
for (const side of [-1, 1]) {
  const leg = new THREE.Group(); leg.position.set(side * .43, 1.15, -.05); torso.add(leg); legs.push(leg);
  fuzz(oval(leg, [0, -.36, 0], [.355, .62, .37]),1100); fuzz(oval(leg, [0, -.91, .10], [.39, .25, .46]),900);
  for (let j = 0; j < 3; j++) oval(leg, [(j - 1) * .19, -1.00, .462], [.067, .042, .015], bellyMaterial);
  const arm = new THREE.Group(); arm.position.set(side * .72, 2.52, -.03); torso.add(arm); arms.push(arm);
  const limb = oval(arm, [side * .09, -.43, .12], [.30, .61, .31]); limb.rotation.z = side * .15;
  fuzz(limb,1200); fuzz(oval(arm, [side * .14, -.89, .16], [.28, .27, .32]),650);
}
function tube(points, radius, material, parent, segments = 48) {
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => V(...p))), segments, radius, 12, false);
  const m = new THREE.Mesh(g, material); m.castShadow = true; parent.add(m); return m;
}
const tail = new THREE.Group(); tail.position.set(0, 1.40, -.65); torso.add(tail);
tube([[0, 0, 0], [.18, -.25, -.17], [.20, -.65, -.13], [.24, -.88, -.16]], .036, skin, tail);
oval(tail, [.24, -.9, -.16], [.07, .16, .065], darkSkin);

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
const trunk = new THREE.Mesh(trunkGeometry, skin); trunk.frustumCulled = false; trunk.castShadow = true; trunk.receiveShadow = true; head.add(trunk);
const tip = new THREE.Group(); head.add(tip);
oval(tip, [0, 0, 0], [.115, .105, .045], darkSkin);
for (const side of [-1, 1]) oval(tip, [side * .042, 0, .04], [.028, .047, .012], black);
oval(tip, [0, .09, .01], [.038, .055, .045]);
const rest = [[0, -.01, .68], [0, -.38, .99], [.09, -.85, 1.02], [.23, -1.36, 1.12], [.32, -1.53, 1.39]];
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
    const r = mix(.285, .10, Math.pow(u, .7)) * (1 + .012 * Math.sin(u * Math.PI * 72)) * (1 - .04 * suck * Math.sin(t * 11 - u * 18));
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
  const walk = 1 - smooth(4.2, 5.6, t), arrive = smooth(.5, 5.6, t);
  // Constant-velocity middle section; eased acceleration and deceleration.
  const travel = smooth(.5, 5.8, t);
  const offscreen = Math.max(5.5, camera.aspect * camera.position.z * .43);
  elephant.position.x = mix(-offscreen, 0, travel);
  elephant.rotation.y = mix(1.12, 0, smooth(3.9, 6.3, t));
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
  arms[1].rotation.z += -1.15*hello + Math.sin(t*9)*.08*hello - .23*giggle;
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
