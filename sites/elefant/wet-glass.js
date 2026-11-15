// Individual curved droplets on a lens. The surface buffer stores a normal,
// optical thickness and coverage; the final pass uses Snell refraction + Fresnel.
export function createWetGlass(THREE, renderer, image) {
  const capacity = 1900;
  const surface = new THREE.WebGLRenderTarget(1,1,{depthBuffer:false});
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,2); camera.position.z=1;
  const geometry = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(2,2));
  const centres = new Float32Array(capacity*2), sizes = new Float32Array(capacity*2), shapes = new Float32Array(capacity*2);
  geometry.setAttribute('centre',new THREE.InstancedBufferAttribute(centres,2).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('size',new THREE.InstancedBufferAttribute(sizes,2).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('shape',new THREE.InstancedBufferAttribute(shapes,2).setUsage(THREE.DynamicDrawUsage));
  geometry.instanceCount=0;
  const material = new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,
    uniforms:{aspect:{value:1}},
    vertexShader:`attribute vec2 centre; attribute vec2 size; attribute vec2 shape;
      varying vec2 local; varying vec2 form; varying float thickness;
      uniform float aspect;
      void main(){local=position.xy; form=shape; thickness=min(size.x*aspect,size.y);
        gl_Position=vec4(centre+position.xy*size,0.,1.);}`,
    fragmentShader:`varying vec2 local; varying vec2 form; varying float thickness;
      void main(){
        // A pinched upper contact line gives hanging beads their teardrop outline.
        vec2 p=local; p.x*=1.+form.x*p.y*.24;
        p.x+=sin(p.y*3.4+form.y)*.055*(1.-p.y*p.y);
        float rr=dot(p,p);float aa=max(fwidth(rr),.008);
        float coverage=1.-smoothstep(1.-aa,1.,rr);if(coverage<.002)discard;
        float z=sqrt(max(.001,1.-rr));
        vec3 normal=normalize(vec3(p*.95,z*.65+.025));
        float height=pow(max(0.,1.-rr),.54);
        gl_FragColor=vec4(normal.xy*.5+.5,min(1.,thickness*21.)*height,coverage);
      }`
  });
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
  let drops=[], width=1,height=1, aspect=1, seeded=false, seed=78321;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const clamp=THREE.MathUtils.clamp;
  const smooth=(a,b,x)=>{const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u);};
  function seedDrops(){
    seed=78321;drops=[];seeded=true;
    // Stratified jitter covers the whole viewport, including its corners.
    const columns=Math.ceil(30*Math.sqrt(aspect)),rows=Math.ceil(30/Math.sqrt(aspect));
    for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
      const u=(x+random())/columns,v=(y+random())/rows;
      const distance=Math.hypot((u-.5)*aspect,v-.47)/Math.max(1,aspect);
      const large=random()>.71, radius=large?.011+random()*.015:.0023+Math.pow(random(),2)*.009;
      drops.push({x:u,y:v,r:radius,stretch:large?1.0+random()*.45:.9+random()*.35,
        born:distance*.68+random()*1.45, speed:large&&random()>.32?.003+random()*.008:0,
        delay:1+random()*4,phase:random()*6.28,pinch:random(),wobble:random()});
    }
    // Beads that overlap coalesce, conserving an approximate cap volume.
    // Keep small satellites separate; these are the fine mist around larger beads.
    for(let i=0;i<drops.length;i++){
      const a=drops[i];if(a.r<.013)continue;
      for(let j=i+1;j<drops.length;j++){
        const b=drops[j];if(b.r<.013)continue;
        const distance=Math.hypot((a.x-b.x)*aspect,(a.y-b.y))/Math.min(1,aspect);
        if(distance<(a.r+b.r)*.63&&Math.cbrt(a.r**3+b.r**3)<.033){
          const va=a.r**3,vb=b.r**3;
          a.x=(a.x*va+b.x*vb)/(va+vb);a.y=(a.y*va+b.y*vb)/(va+vb);
          a.r=Math.cbrt(va+vb);a.stretch=Math.min(1.8,Math.max(a.stretch,b.stretch)+.08);
          a.speed=Math.max(a.speed,b.speed);a.born=Math.min(a.born,b.born);b.r=0;
        }
      }
    }
    drops=drops.filter(d=>d.r>0);
    // Close satellite beads around impact points: fine spray and pooled pairs.
    for(let i=0;i<140;i++){
      const d=drops[Math.floor(random()*drops.length)];
      drops.push({...d,x:d.x+(random()-.5)*.027,y:d.y+(random()-.5)*.032,r:.0015+random()*.0035,speed:0,born:d.born+.06});
    }
  }
  function resize(w,h){width=w;height=h;aspect=w/h;material.uniforms.aspect.value=aspect;
    surface.setSize(Math.round(w),Math.round(h));
    if(seeded) seedDrops();
  }
  function write(index,x,y,rx,ry,pinch,phase){
    centres[index*2]=x*2-1;centres[index*2+1]=1-y*2;
    sizes[index*2]=rx; sizes[index*2+1]=ry;
    shapes[index*2]=pinch;shapes[index*2+1]=phase;
  }
  function update(t){
    if(!seeded)seedDrops();
    const since=t-12.55, ratio=Math.min(1,aspect);let count=0;
    for(const d of drops){
      const age=since-d.born;if(age<0)continue;
      const growth=smooth(0,.065,age);
      const settle=Math.sin(age*34)*Math.exp(-age*9)*.26;
      const slide=Math.max(0,age-d.delay);
      const dy=d.speed*(slide-(1-Math.exp(-slide*2))*.5);
      const x=d.x+Math.sin(slide*1.2+d.phase)*d.speed*.10*smooth(0,1,slide);
      const y=d.y+dy;
      const rx=d.r*2*ratio/aspect*growth*(1+settle);
      const ry=d.r*2*ratio*d.stretch*growth*(1-settle*.65);
      // A thin residual track follows larger sliding beads, not the whole screen.
      if(dy>.002&&count<capacity-1){
        write(count++,x,d.y+dy*.5,rx*.16,dy*.99,0,d.phase);
      }
      if(y<1.1&&count<capacity)write(count++,x,y,rx,ry,d.pinch,d.phase);
    }
    geometry.instanceCount=count;
    geometry.attributes.centre.needsUpdate=geometry.attributes.size.needsUpdate=geometry.attributes.shape.needsUpdate=true;
  }
  const postScene=new THREE.Scene(),postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const post=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,
    uniforms:{image:{value:image},surface:{value:surface.texture},resolution:{value:new THREE.Vector2(1,1)},wet:{value:0},impact:{value:0},time:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`precision highp float;
      varying vec2 vUv;uniform sampler2D image;uniform sampler2D surface;
      uniform vec2 resolution;uniform float wet;uniform float impact;uniform float time;
      vec3 sampleScene(vec2 uv){return texture2D(image,clamp(uv,vec2(.001),vec2(.999))).rgb;}
      float softbox(vec2 p,vec2 centre,vec2 extent){
        vec2 d=abs(p-centre)/extent;return (1.-smoothstep(.75,1.,d.x))*(1.-smoothstep(.65,1.,d.y));
      }
      void main(){
        vec2 uv=vUv;float aspect=resolution.x/resolution.y;
        vec4 data=texture2D(surface,uv);float mask=data.a*wet;
        vec2 nxy=(data.rg*2.-1.);float nz=sqrt(max(.018,1.-dot(nxy,nxy)));
        vec3 normal=normalize(vec3(nxy,nz));
        // Snell's law at the convex air/water boundary (n_water = 1.333).
        vec3 ray=refract(vec3(0.,0.,-1.),normal,1./1.333);
        vec2 opticalScale=vec2(1./aspect,1.)*min(1.,aspect);
        vec2 offset=ray.xy/max(.15,abs(ray.z))*data.b*.072*opticalScale;
        vec2 radial=uv-vec2(.5,.48);
        float radialDistance=length(radial*vec2(aspect,1.));
        float front=(time-12.55)*1.35;
        float wave=sin((radialDistance-front)*65.)*exp(-pow((radialDistance-front)*14.,2.));
        vec2 splash=radial*wave*.009*impact;
        vec2 distorted=uv+offset*mask+splash;
        vec2 pixel=1./resolution;
        // Most dry gaps stay sharp; blur belongs inside the thickest beads.
        vec2 blur=pixel*(.65*wet+data.b*2.8*mask);
        vec3 color=sampleScene(distorted)*.52;
        color+=sampleScene(distorted+vec2(blur.x,0.))*.12;
        color+=sampleScene(distorted-vec2(blur.x,0.))*.12;
        color+=sampleScene(distorted+vec2(0.,blur.y))*.12;
        color+=sampleScene(distorted-vec2(0.,blur.y))*.12;
        float fresnel=.0204+.9796*pow(1.-normal.z,5.);
        // A bright upper window and darker room reflected on the curved surface.
        vec3 reflection=mix(vec3(.08,.10,.12),vec3(.60,.68,.72),smoothstep(-.5,.6,normal.y));
        float window=softbox(normal.xy,vec2(-.38,.49),vec2(.18,.30));
        float glint=pow(max(0.,dot(normal,normalize(vec3(-.4,.55,.72)))),100.);
        float lowerGlint=pow(max(0.,dot(normal,normalize(vec3(.32,-.64,.67)))),46.);
        float rim=pow(1.-normal.z,3.);
        vec3 drop=mix(color,reflection,min(.78,.025+fresnel*1.28));
        drop*=1.-rim*.32-(1.-smoothstep(.18,.65,normal.z))*.20;
        drop-=vec3(.12,.115,.105)*(1.-smoothstep(.10,.48,normal.z));
        drop+=vec3(1.,.98,.94)*(window*.27+glint*.85+lowerGlint*.10);
        // Thin focused-light crescent beneath a bead.
        float caustic=pow(max(0.,normal.y*-.9),8.)*pow(normal.z,2.);
        drop+=vec3(.20,.23,.24)*caustic;
        color=mix(color,drop,mask);
        float rimShadow=max(0.,texture2D(surface,uv+pixel*vec2(-1.4,2.)).a-data.a);
        color*=1.-rimShadow*.10*wet;
        color=mix(color,vec3(.94,.97,1.),impact*.045);
        gl_FragColor=vec4(max(vec3(0.),color),1.);
        #include <tonemapping_fragment>
        gl_FragColor.rgb/=toneMapping(vec3(1.));
        #include <colorspace_fragment>
      }`
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),post));
  const clear = new THREE.Color(.5,.5,0);
  function render(t,wet,impact){
    post.uniforms.time.value=t;post.uniforms.wet.value=wet;post.uniforms.impact.value=impact;
    if(wet>.0001){
      update(t);renderer.setRenderTarget(surface);renderer.setClearColor(clear,0);renderer.render(scene,camera);renderer.setClearColor(0xffffff,1);
    }
    renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
  }
  function reset(){seeded=false;geometry.instanceCount=0;}
  return {resize(w,h){resize(w,h);post.uniforms.resolution.value.set(w,h);},render,reset,post};
}
