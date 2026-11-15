import * as THREE from './vendor/three.module.min.js';

// All geometry, textures and animation are generated locally. No remote assets.
const stage = document.querySelector('#stage');
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
  ctx.fillStyle = '#92918f'; ctx.fillRect(0, 0, 1024, 1024);
  const data = ctx.getImageData(0, 0, 1024, 1024);
  for (let i = 0; i < data.data.length; i += 4) {
    const n = (rand() - .5) * 24;
    data.data[i] += n; data.data[i + 1] += n; data.data[i + 2] += n;
  }
  ctx.putImageData(data, 0, 0);
  // Broken, crossing furrows, rather than a regular tiled grid.
  for (let i = 0; i < 2600; i++) {
    const x = rand() * 1024, y = rand() * 1024, len = 9 + rand() * 80;
    ctx.lineWidth = .4 + rand() * 1.8;
    ctx.strokeStyle = `rgba(40,34,30,${.06 + rand() * .18})`;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + len * .3, y - 4, x + len * .6, y + 8, x + len, y + rand() * 12); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,215,199,.12)';
    ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + len, y + 4); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2); tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}
const texture = skinTexture();
const skin = new THREE.MeshStandardMaterial({ color: 0x7a7c7e, map: texture, bumpMap: texture, bumpScale: .065, roughness: .93 });
const innerSkin = skin.clone(); innerSkin.color.set(0x9f9390); innerSkin.side = THREE.DoubleSide;
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
oval(torso, [0, 1.87, -.16], [.87, 1.25, .66]);
oval(torso, [0, 2.67, .02], [.68, .72, .61]);
const head = new THREE.Group(); head.position.set(0, 3.21, .13); torso.add(head);
const skull = oval(head, [0, .02, .03], [.73, .83, .66]);
// Sculpt both forehead domes into a single continuous surface.
skull.geometry = sphere.clone();
const skullPosition = skull.geometry.attributes.position;
for (let i=0;i<skullPosition.count;i++) {
  const x=skullPosition.getX(i), y=skullPosition.getY(i), z=skullPosition.getZ(i);
  const crown=smooth(.35,.9,y);
  skullPosition.setY(i,y + crown * .065 * Math.cos(x*7));
  skullPosition.setZ(i,z + Math.max(0,z)*Math.exp(-Math.pow((y+.2)*3,2))*.07);
}
skull.geometry.computeVertexNormals();
oval(head, [0, -.41, .12], [.54, .38, .46]);
for (const side of [-1, 1]) {
  oval(head, [side * .43, -.17, .36], [.245, .32, .22]);
  oval(head, [side * .43, .12, .544], [.14, .115, .08], skin);
  const eye = oval(head, [side * .438, .115, .627], [.058, .045, .035], black);
  oval(head, [side * .42, .133, .66], [.013, .012, .006], new THREE.MeshBasicMaterial({ color: 0xe4e2d9 }));
  const brow = oval(head, [side * .43, .187, .576], [.17, .065, .07]); brow.rotation.z = side * -.12;
}

// Thin, cupped ears with a scalloped perimeter and visible radial folds.
const ears = [];
for (const side of [-1, 1]) {
  const pivot = new THREE.Group(); pivot.position.set(side * .52, .13, -.04); head.add(pivot); ears.push(pivot);
  const positions = [], uvs = [], indices = []; const rings = 22, segs = 96;
  for (let r = 0; r <= rings; r++) for (let a = 0; a <= segs; a++) {
    const f = r / rings, theta = a / segs * Math.PI * 2;
    const scallop = 1 + .035 * Math.sin(theta * 7) + .018 * Math.sin(theta * 13);
    const ex = .58 + .62 * Math.cos(theta), ey = .94 * Math.sin(theta);
    positions.push(side * ex * f * scallop, ey * f * scallop - .12 * f,
      -.08 - .27 * f * f + .026 * Math.sin(theta * 9 + f * 4) * f * f + .12 * Math.cos(theta) * f);
    uvs.push((ex * f + .1) * .8, (ey * f + 1) * .5);
    if (r < rings && a < segs) { const i = r * (segs + 1) + a; indices.push(i, i + 1, i + segs + 1, i + 1, i + segs + 2, i + segs + 1); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const ear = new THREE.Mesh(geometry, innerSkin); ear.castShadow = true; ear.receiveShadow = true; pivot.add(ear);
}
const legs = [], arms = [];
for (const side of [-1, 1]) {
  const leg = new THREE.Group(); leg.position.set(side * .43, 1.15, -.05); torso.add(leg); legs.push(leg);
  oval(leg, [0, -.34, 0], [.38, .69, .39]); oval(leg, [0, -.91, .09], [.38, .25, .46]);
  for (let j = 0; j < 3; j++) oval(leg, [(j - 1) * .19, -1.00, .462], [.076, .065, .018], ivory);
  const arm = new THREE.Group(); arm.position.set(side * .72, 2.52, -.03); torso.add(arm); arms.push(arm);
  const limb = oval(arm, [side * .08, -.53, .08], [.26, .74, .28]); limb.rotation.z = side * .15;
  oval(arm, [side * .13, -1.08, .1], [.25, .28, .29]);
}
function tube(points, radius, material, parent, segments = 48) {
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => V(...p))), segments, radius, 12, false);
  const m = new THREE.Mesh(g, material); m.castShadow = true; parent.add(m); return m;
}
for (const side of [-1, 1]) {
  const curve = new THREE.CatmullRomCurve3([V(side * .37, -.35, .46), V(side * .46, -.59, .74), V(side * .50, -.53, 1.02), V(side * .48, -.39, 1.13)]);
  const g = new THREE.TubeGeometry(curve, 32, .075, 12, false);
  const p = g.attributes.position;
  for (let i = 0; i <= 32; i++) { const c = curve.getPointAt(i / 32), taper = Math.pow(1 - i / 32, .7); for (let j = 0; j <= 12; j++) { const k = i * 13 + j; p.setXYZ(k, mix(c.x, p.getX(k), taper), mix(c.y, p.getY(k), taper), mix(c.z, p.getZ(k), taper)); } }
  g.computeVertexNormals(); const m = new THREE.Mesh(g, ivory); m.castShadow = true; head.add(m);
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
const rest = [[0, .02, .59], [0, -.45, .83], [.06, -1.1, .88], [.14, -1.75, .93], [.10, -2.12, 1.08]];
const down = [[0, .02, .59], [0, -.6, .83], [.08, -1.5, .95], [.12, -2.6, 1.2], [.04, -3.12, 1.52]];
const aim = [[0, .02, .59], [0, -.42, .99], [0, -.68, 1.45], [0, -.45, 1.93], [0, -.08, 2.37]];
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
  for (let i = 0; i <= trunkSegments; i++) {
    const u = i / trunkSegments; trunkCurve.getPoint(u, point); trunkCurve.getTangent(u, tangent).normalize();
    axis.crossVectors(Math.abs(tangent.y) > .97 ? V(0, 0, 1) : up, tangent).normalize(); binormal.crossVectors(tangent, axis).normalize();
    const r = mix(.255, .093, Math.pow(u, .7)) * (1 + .035 * Math.sin(u * Math.PI * 100)) * (1 - .04 * suck * Math.sin(t * 11 - u * 18));
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
const particleCount = 4600, particlePositions = new Float32Array(particleCount * 3), particleSizes = new Float32Array(particleCount);
const particles = Array.from({ length: particleCount }, () => ({ age: 10, life: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), size: .03 }));
const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
pg.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1).setUsage(THREE.DynamicDrawUsage));
const waterMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
  uniforms: { pixelRatio: { value: 1 } },
  vertexShader: `attribute float size; uniform float pixelRatio; varying float vDepth;
  void main(){vec4 p=modelViewMatrix*vec4(position,1.);vDepth=-p.z; gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*520.*pixelRatio/max(.2,-p.z),0.,130.);}`,
  fragmentShader: `varying float vDepth; void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;
  float h=pow(max(0.,1.-r),.5);float rim=pow(r,3.)*.45;float light=pow(max(0.,1.-length(p-vec2(-.28,.32))*1.8),5.);
  gl_FragColor=vec4(vec3(.62,.77,.83)+light*.6-rim*.2, (.12+rim*.5+light*.4)*smoothstep(1.,.75,r));}` });
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
  updateJet(strength);
  if (strength > 0) {
    emission += dt * 2100 * strength;
    while (emission >= 1) {
      emission--; const p = particles[nextParticle++ % particleCount]; p.age = 0; p.life = .7 + rand() * .6;
      p.p.copy(nozzle); p.v.copy(direction).multiplyScalar(11 + rand() * 9);
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

// Height field on the glass. Its gradient gives a refracting surface normal.
const glass = document.createElement('canvas'); glass.width = glass.height = 1024;
const gc = glass.getContext('2d');
const glassTexture = new THREE.CanvasTexture(glass); glassTexture.minFilter = THREE.LinearFilter;
const drops = []; let wetness = 0, wiped = false, lastGlass = -1, splashSeeded = false;
function seedDrops() {
  drops.length = 0;
  for (let i = 0; i < 360; i++) {
    const angle = rand() * Math.PI * 2, distance = Math.sqrt(rand());
    drops.push({ x: clamp(.5 + Math.cos(angle) * distance * .8, -.03, 1.03), y: clamp(.48 + Math.sin(angle) * distance * .8, -.03, 1.03),
      r: .0025 + rand() ** 2 * .025, stretch: 1 + rand() * .65, born: rand() * .6, speed: rand() > .73 ? .005 + rand() * .021 : .0001, phase: rand() * 10 });
  }
}
function drawGlass(t) {
  gc.fillStyle = '#000'; gc.fillRect(0, 0, 1024, 1024);
  const since = t - 12.6;
  for (const d of drops) {
    const a = smooth(d.born, d.born + .11, since); if (!a) continue;
    const y = d.y + Math.max(0, since - d.born - .5) * d.speed;
    const x = d.x + Math.sin(since * .7 + d.phase) * d.speed * .13;
    const radius = d.r * a * 1024;
    gc.save(); gc.translate(x * 1024, y * 1024); gc.scale(1, d.stretch);
    const gradient = gc.createRadialGradient(-radius * .12, -radius * .12, 0, 0, 0, radius);
    gradient.addColorStop(0, '#dadada'); gradient.addColorStop(.55, '#b0b0b0'); gradient.addColorStop(.82, '#777'); gradient.addColorStop(.94, '#272727'); gradient.addColorStop(1, '#000');
    gc.fillStyle = gradient; gc.beginPath(); gc.arc(0, 0, radius, 0, Math.PI * 2); gc.fill(); gc.restore();
    if (d.speed > .005 && since > 1) {
      gc.lineWidth = Math.max(1, radius * .19); gc.lineCap = 'round'; gc.strokeStyle = '#2a2a2a'; gc.beginPath();
      gc.moveTo(x * 1024, (d.y + .015) * 1024); gc.quadraticCurveTo((x + .004) * 1024, (y + d.y) * 512, x * 1024, y * 1024); gc.stroke();
    }
  }
  glassTexture.needsUpdate = true;
}
const postScene = new THREE.Scene(), postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const post = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
  uniforms: { image: { value: target.texture }, glass: { value: glassTexture }, resolution: { value: new THREE.Vector2() }, wet: { value: 0 }, impact: { value: 0 }, time: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D image; uniform sampler2D glass;
  uniform vec2 resolution; uniform float wet; uniform float impact; uniform float time;
  void main(){vec2 uv=vUv;float h=texture2D(glass,uv).r; vec2 e=vec2(1./1024.,0.);
  vec2 grad=vec2(texture2D(glass,uv+e).r-texture2D(glass,uv-e).r,texture2D(glass,uv+e.yx).r-texture2D(glass,uv-e.yx).r);
  vec2 p=uv-vec2(.5,.48); float aspect=resolution.x/resolution.y;
  float wave=sin(length(p*vec2(aspect,1.))*55.-time*16.)*impact;
  vec2 distorted=clamp(uv+grad*.18*wet+p*wave*.025+vec2(sin(uv.y*24.+time*.4),cos(uv.x*18.+time*.3))*.0025*wet,vec2(.002),vec2(.998));
  vec2 blur=(vec2(4.5)+h*7.+impact*12.)/resolution*wet;
  vec3 color=texture2D(image,distorted).rgb*.20;
  color+=texture2D(image,distorted+blur*vec2(1.,0.)).rgb*.12;
  color+=texture2D(image,distorted-blur*vec2(1.,0.)).rgb*.12;
  color+=texture2D(image,distorted+blur*vec2(0.,1.)).rgb*.12;
  color+=texture2D(image,distorted-blur*vec2(0.,1.)).rgb*.12;
  color+=texture2D(image,distorted+blur*vec2(.71,.71)).rgb*.08;
  color+=texture2D(image,distorted-blur*vec2(.71,.71)).rgb*.08;
  color+=texture2D(image,distorted+blur*vec2(-.71,.71)).rgb*.08;
  color+=texture2D(image,distorted-blur*vec2(-.71,.71)).rgb*.08;
  float edge=length(grad); float highlight=clamp(dot(grad,normalize(vec2(-.7,.7)))*2.,0.,.38);
  color*=1.-clamp(edge*.56,0.,.24)*wet;
  color-=clamp(edge*1.6,0.,.16)*wet;
  color+=highlight*wet+pow(max(0.,h-.35),3.)*.18*wet;
  color=mix(color,vec3(.91,.96,.98),wet*(.035+impact*.25));
  gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
gl_FragColor.rgb /= toneMapping(vec3(1.));
#include <colorspace_fragment>
}` });
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));

let width, height;
function resize() {
  width = stage.clientWidth; height = stage.clientHeight;
  renderer.setSize(width, height); camera.aspect = width / height;
  const distance = Math.max(9.2, 6.6 / camera.aspect);
  camera.position.set(0, 2.8, distance); camera.lookAt(0, 2.05, 0); camera.updateProjectionMatrix();
  target.setSize(Math.round(width * renderer.getPixelRatio()), Math.round(height * renderer.getPixelRatio()));
  post.uniforms.resolution.value.set(target.width, target.height); waterMaterial.uniforms.pixelRatio.value = renderer.getPixelRatio();
}
window.addEventListener('resize', resize); resize();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let time = reducedMotion ? 5.8 : 0, paused = reducedMotion, previous = performance.now(), animationId;
const pauseButton = document.querySelector('#pause');
function updatePause() { pauseButton.textContent = paused ? '▷' : 'Ⅱ'; pauseButton.setAttribute('aria-label', paused ? 'Animation abspielen' : 'Animation pausieren'); pauseButton.title = paused ? 'Abspielen' : 'Pause'; }
function reset() {
  time = 0; wetness = 0; wiped = false; splashSeeded = false; paused = false; emission = 0; lastGlass = -1;
  particles.forEach(p => { p.age = 10; }); document.body.classList.remove('wet'); document.querySelector('#status').textContent = 'Die Szene beginnt.'; updatePause();
}
document.querySelector('#replay').addEventListener('click', reset);
pauseButton.addEventListener('click', () => { paused = !paused; updatePause(); });
document.querySelector('#wipe').addEventListener('click', () => { wiped = true; wetness = 0; post.uniforms.wet.value = 0; document.body.classList.remove('wet'); document.querySelector('#status').textContent = 'Die Scheibe ist wieder trocken.'; });
document.addEventListener('visibilitychange', () => { previous = performance.now(); });
updatePause();
function frame(now) {
  animationId = requestAnimationFrame(frame);
  const dt = document.hidden || paused ? 0 : Math.min((now - previous) / 1000, .04); previous = now; time += dt;
  const t = time;
  const walk = 1 - smooth(4.2, 5.6, t), arrive = smooth(.5, 5.6, t);
  // Constant-velocity middle section; eased acceleration and deceleration.
  const travel = smooth(.5, 5.8, t);
  const offscreen = Math.max(5.5, camera.aspect * camera.position.z * .43);
  elephant.position.x = mix(-offscreen, 0, travel);
  elephant.rotation.y = mix(1.12, 0, smooth(3.9, 6.3, t));
  torso.position.y = Math.abs(Math.sin(t * 4.7)) * .055 * walk + Math.sin(t * 1.5) * .012 * arrive;
  torso.rotation.z = Math.sin(t * 4.7) * .033 * walk;
  torso.rotation.x = .025 * smooth(6.5, 7.8, t) * (1 - smooth(10.2, 11.7, t));
  legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 4.7 + i * Math.PI) * .33 * walk; l.position.y = 1.15 + Math.max(0, Math.sin(t * 4.7 + i * Math.PI)) * .07 * walk; });
  arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 4.7 + i * Math.PI + Math.PI) * .2 * walk; a.rotation.z = (i ? -1 : 1) * .02 * Math.sin(t * 1.5); });
  head.rotation.y = Math.sin(t * .8) * .025 * arrive;
  head.rotation.x = .055 * smooth(6.4, 7.8, t) * (1 - smooth(10.4, 11.7, t)) - .035 * smooth(11, 12.2, t);
  ears.forEach((ear, i) => { const side = i ? 1 : -1; ear.rotation.y = side * (.10 + Math.sin(t * 1.8 + i * .2) * .075 + smooth(11.7, 12.2, t) * .12 * (1 - smooth(14.3, 15.5, t))); ear.rotation.z = side * Math.sin(t * 1.4) * .018; });
  tail.rotation.z = Math.sin(t * 2) * .22;
  const lower = smooth(6.2, 7.8, t), raise = smooth(10.3, 12.1, t);
  const strength = smooth(12.1, 12.35, t) * (1 - smooth(13.8, 14.4, t));
  animateTrunk(t, lower * (1 - smooth(14.8, 17, t)), raise * (1 - smooth(14.8, 17, t)), strength > 0);
  elephant.updateMatrixWorld(true); spray(dt, strength);
  if (t >= 12.6 && !splashSeeded) { seedDrops(); splashSeeded = true; document.body.classList.add('wet'); document.querySelector('#status').textContent = 'Der Elefant hat die Scheibe nass gespritzt.'; }
  const desiredWet = wiped ? 0 : smooth(12.6, 13.25, t);
  wetness = mix(wetness, desiredWet, dt ? Math.min(1, dt * (wiped ? 4 : 12)) : 0);
  if (splashSeeded && wetness > .001 && t - lastGlass > 1 / 30) { drawGlass(t); lastGlass = t; }
  post.uniforms.wet.value = wetness; post.uniforms.time.value = t;
  post.uniforms.impact.value = smooth(12.6, 12.85, t) * (1 - smooth(13, 14.5, t));
  renderer.setRenderTarget(target); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(postScene, postCamera);
  document.querySelector('#loading').hidden = true;
}
renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(animationId); document.querySelector('#error').hidden = false; });
renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());
requestAnimationFrame(frame);
// Useful for deterministic visual verification, without adding controls to the scene.
if (new URLSearchParams(location.search).has('frame')) {
  time = clamp(Number(new URLSearchParams(location.search).get('frame')) || 0, 0, 60); paused = true;
  if (time >= 12.6) { seedDrops(); splashSeeded = true; wetness = 1; drawGlass(time); document.body.classList.add('wet'); }
  if (time > 12.1 && time < 14.4) {
    animateTrunk(time, 1, 1, true); elephant.position.x=0; elephant.updateMatrixWorld(true);
    for(let i=0;i<24;i++) spray(1/60,1);
  }
  updatePause();
}
