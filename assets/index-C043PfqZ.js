(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function a(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(r){if(r.ep)return;r.ep=!0;const i=a(r);fetch(r.href,i)}})();const V=`struct Uniforms {
  mvpMatrix : mat4x4<f32>,
};

@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) T: vec3<f32>, // Tangent
  @location(2) B: vec3<f32>, // Bitangent
  @location(3) N: vec3<f32>, // Normal
  @location(4) worldPos: vec3<f32>, // Added World Position
};

@vertex
fn main(@location(0) position: vec3<f32>,
        @location(1) uv: vec2<f32>,
        @location(2) normal: vec3<f32>,
        @location(3) tangent: vec3<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.Position = uniforms.mvpMatrix * vec4<f32>(position, 1.0);
  output.worldPos = position; // Pass the original model position
  output.uv = uv;

  // Calculate TBN matrix vectors
  output.N = normalize(normal);
  output.T = normalize(tangent);
  output.B = normalize(cross(output.N, output.T));
  
  return output;
}`,q=`@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var colorTexture: texture_2d<f32>;
@group(0) @binding(3) var normalTexture: texture_2d<f32>;
@group(0) @binding(4) var bumpTexture: texture_2d<f32>;

struct FragmentInput {
  @location(0) uv: vec2<f32>,
  @location(1) T: vec3<f32>,
  @location(2) B: vec3<f32>,
  @location(3) N: vec3<f32>,
  @location(4) worldPos: vec3<f32>,
};

@fragment fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  // --- Create TBN Matrix (Tangent Space to World Space) ---
  let T = normalize(input.T);
  let B = normalize(input.B);
  let N = normalize(input.N);
  
  // Construct the matrix where each column is a basis vector
  let tbnMatrix = mat3x3<f32>(T, B, N);

  // --- Parallax Effect ---
  let viewDir = normalize(-input.worldPos);
  
  // Transform view direction TO tangent space (use inverse/transpose of TBN)
  let viewDirTangentSpace = vec3<f32>(
    dot(viewDir, T),
    dot(viewDir, B),
    dot(viewDir, N)
  );

  let parallax_strength = 0.04;
  let height = textureSample(bumpTexture, mySampler, input.uv).r;
  let parallax_offset = viewDirTangentSpace.xy * height * parallax_strength;
  let parallax_uv = input.uv - parallax_offset;

  // --- Sample Textures ---
  let base_color = textureSample(colorTexture, mySampler, parallax_uv);

  // Get normal from map (in tangent space) and transform to world space
  var normal_from_map = textureSample(normalTexture, mySampler, parallax_uv).xyz * 2.0 - 1.0;
  let final_normal = normalize(tbnMatrix * normal_from_map);

  // --- Simple Blinn-Phong Lighting ---
  let light_pos = vec3<f32>(5.0, 5.0, -5.0);
  let light_dir = normalize(light_pos - input.worldPos);
  let light_color = vec3<f32>(1.0, 1.0, 1.0);

  // Ambient
  let ambient = 0.1 * base_color.rgb;

  // Diffuse
  let diffuse_strength = max(dot(final_normal, light_dir), 0.0);
  let diffuse = diffuse_strength * light_color * base_color.rgb;

  // Specular
  let reflectDir = reflect(-light_dir, final_normal);
  let specular_strength = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
  let specular = specular_strength * light_color;

  let final_color = vec4<f32>(ambient + diffuse + specular, 1.0);

  return final_color;
}`;var I=typeof Float32Array<"u"?Float32Array:Array;function N(){var e=new I(16);return I!=Float32Array&&(e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0),e[0]=1,e[5]=1,e[10]=1,e[15]=1,e}function Y(e,t,a){var n=t[0],r=t[1],i=t[2],o=t[3],d=t[4],p=t[5],u=t[6],m=t[7],g=t[8],v=t[9],h=t[10],x=t[11],y=t[12],T=t[13],w=t[14],P=t[15],c=a[0],f=a[1],s=a[2],l=a[3];return e[0]=c*n+f*d+s*g+l*y,e[1]=c*r+f*p+s*v+l*T,e[2]=c*i+f*u+s*h+l*w,e[3]=c*o+f*m+s*x+l*P,c=a[4],f=a[5],s=a[6],l=a[7],e[4]=c*n+f*d+s*g+l*y,e[5]=c*r+f*p+s*v+l*T,e[6]=c*i+f*u+s*h+l*w,e[7]=c*o+f*m+s*x+l*P,c=a[8],f=a[9],s=a[10],l=a[11],e[8]=c*n+f*d+s*g+l*y,e[9]=c*r+f*p+s*v+l*T,e[10]=c*i+f*u+s*h+l*w,e[11]=c*o+f*m+s*x+l*P,c=a[12],f=a[13],s=a[14],l=a[15],e[12]=c*n+f*d+s*g+l*y,e[13]=c*r+f*p+s*v+l*T,e[14]=c*i+f*u+s*h+l*w,e[15]=c*o+f*m+s*x+l*P,e}function W(e,t,a){var n=a[0],r=a[1],i=a[2],o,d,p,u,m,g,v,h,x,y,T,w;return t===e?(e[12]=t[0]*n+t[4]*r+t[8]*i+t[12],e[13]=t[1]*n+t[5]*r+t[9]*i+t[13],e[14]=t[2]*n+t[6]*r+t[10]*i+t[14],e[15]=t[3]*n+t[7]*r+t[11]*i+t[15]):(o=t[0],d=t[1],p=t[2],u=t[3],m=t[4],g=t[5],v=t[6],h=t[7],x=t[8],y=t[9],T=t[10],w=t[11],e[0]=o,e[1]=d,e[2]=p,e[3]=u,e[4]=m,e[5]=g,e[6]=v,e[7]=h,e[8]=x,e[9]=y,e[10]=T,e[11]=w,e[12]=o*n+m*r+x*i+t[12],e[13]=d*n+g*r+y*i+t[13],e[14]=p*n+v*r+T*i+t[14],e[15]=u*n+h*r+w*i+t[15]),e}function H(e,t,a){var n=Math.sin(a),r=Math.cos(a),i=t[4],o=t[5],d=t[6],p=t[7],u=t[8],m=t[9],g=t[10],v=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=i*r+u*n,e[5]=o*r+m*n,e[6]=d*r+g*n,e[7]=p*r+v*n,e[8]=u*r-i*n,e[9]=m*r-o*n,e[10]=g*r-d*n,e[11]=v*r-p*n,e}function X(e,t,a){var n=Math.sin(a),r=Math.cos(a),i=t[0],o=t[1],d=t[2],p=t[3],u=t[8],m=t[9],g=t[10],v=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=i*r-u*n,e[1]=o*r-m*n,e[2]=d*r-g*n,e[3]=p*r-v*n,e[8]=i*n+u*r,e[9]=o*n+m*r,e[10]=d*n+g*r,e[11]=p*n+v*r,e}function j(e,t,a,n,r){var i=1/Math.tan(t/2);if(e[0]=i/a,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=i,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,r!=null&&r!==1/0){var o=1/(n-r);e[10]=(r+n)*o,e[14]=2*r*n*o}else e[10]=-1,e[14]=-2*n;return e}var K=j;const D=document.getElementById("startButton"),k=document.getElementById("audioOverlay"),R=document.getElementById("errorMessage"),b=document.getElementById("gpuCanvas");let E,U;async function J(){E||(E=new(window.AudioContext||window.webkitAudioContext)),E.state==="suspended"&&await E.resume();try{const e=await navigator.mediaDevices.getUserMedia({audio:!0}),t=E.createMediaStreamSource(e);return U=E.createAnalyser(),U.fftSize=2048,U.smoothingTimeConstant=.5,t.connect(U),!0}catch(e){return R.innerHTML=`
      <strong>Error:</strong> Microphone access failed.<br>
      If you're inside an app like LinkedIn, please open this page in your main browser (Chrome, Safari, etc.) to grant permission.
    `,console.error("Error accessing microphone:",e),!1}}async function Q(){if(!await J()){D.disabled=!1;return}k.style.display="none",b.style.display="block",await Z()}D.addEventListener("click",()=>{D.disabled=!0,R.textContent="Requesting microphone access...",Q()});async function Z(){if(!navigator.gpu){document.body.innerHTML="<h1>WebGPU not supported!</h1>";return}const t=await(await navigator.gpu.requestAdapter()).requestDevice(),a=b.getContext("webgpu"),n=navigator.gpu.getPreferredCanvasFormat();a.configure({device:t,format:n});let r,i;const o=()=>{b.width=window.innerWidth,b.height=window.innerHeight,r&&r.destroy(),r=t.createTexture({size:[b.width,b.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),i=r.createView()};o(),window.addEventListener("resize",o);const d=new Float32Array(U.fftSize),p=new Float32Array([-.5,-.5,.5,0,1,0,0,1,1,0,0,.5,-.5,.5,1,1,0,0,1,1,0,0,.5,.5,.5,1,0,0,0,1,1,0,0,-.5,.5,.5,0,0,0,0,1,1,0,0,-.5,-.5,-.5,1,1,0,0,-1,-1,0,0,.5,-.5,-.5,0,1,0,0,-1,-1,0,0,.5,.5,-.5,0,0,0,0,-1,-1,0,0,-.5,.5,-.5,1,0,0,0,-1,-1,0,0,-.5,.5,-.5,0,1,0,1,0,1,0,0,.5,.5,-.5,1,1,0,1,0,1,0,0,.5,.5,.5,1,0,0,1,0,1,0,0,-.5,.5,.5,0,0,0,1,0,1,0,0,-.5,-.5,-.5,0,0,0,-1,0,1,0,0,.5,-.5,-.5,1,0,0,-1,0,1,0,0,.5,-.5,.5,1,1,0,-1,0,1,0,0,-.5,-.5,.5,0,1,0,-1,0,1,0,0,.5,-.5,-.5,1,1,1,0,0,0,0,-1,.5,.5,-.5,1,0,1,0,0,0,0,-1,.5,.5,.5,0,0,1,0,0,0,0,-1,.5,-.5,.5,0,1,1,0,0,0,0,-1,-.5,-.5,-.5,0,1,-1,0,0,0,0,1,-.5,.5,-.5,0,0,-1,0,0,0,0,1,-.5,.5,.5,1,0,-1,0,0,0,0,1,-.5,-.5,.5,1,1,-1,0,0,0,0,1]),u=new Uint16Array([0,1,2,0,2,3,4,7,6,4,6,5,8,11,10,8,10,9,12,15,14,12,14,13,16,19,18,16,18,17,20,23,22,20,22,21]),m=t.createBuffer({size:p.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(m,0,p);const g=t.createBuffer({size:u.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(g,0,u);const v=t.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});async function h(A){const M=document.createElement("img");M.src=A,await M.decode();const S=await createImageBitmap(M),G=t.createTexture({size:[S.width,S.height,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});return t.queue.copyExternalImageToTexture({source:S},{texture:G},[S.width,S.height]),G}const[x,y,T]=await Promise.all([h("crate1_diffuse.png"),h("crate1_normal.png"),h("crate1_bump.png")]),w=t.createSampler({magFilter:"linear",minFilter:"linear"}),P=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]}),c=t.createBindGroup({layout:P,entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:w},{binding:2,resource:x.createView()},{binding:3,resource:y.createView()},{binding:4,resource:T.createView()}]}),f=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[P]}),vertex:{module:t.createShaderModule({code:V}),entryPoint:"main",buffers:[{arrayStride:44,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"},{shaderLocation:2,offset:20,format:"float32x3"},{shaderLocation:3,offset:32,format:"float32x3"}]}]},fragment:{module:t.createShaderModule({code:q}),entryPoint:"main",targets:[{format:n}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}});let s=0;function l(){U.getFloatTimeDomainData(d);let A=0;for(const z of d)A+=z*z;const S=.01+Math.sqrt(A/d.length)*5;s+=S;const G=b.width/b.height,C=N();K(C,45*Math.PI/180,G,.1,10);const _=N();W(_,_,[0,0,-4]),H(_,_,s*.5),X(_,_,s);const L=N();Y(L,C,_),t.queue.writeBuffer(v,0,L);const O=t.createCommandEncoder(),F=a.getCurrentTexture().createView(),B=O.beginRenderPass({colorAttachments:[{view:F,loadOp:"clear",storeOp:"store",clearValue:{r:.1,g:.1,b:.1,a:1}}],depthStencilAttachment:{view:i,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});B.setPipeline(f),B.setBindGroup(0,c),B.setVertexBuffer(0,m),B.setIndexBuffer(g,"uint16"),B.drawIndexed(u.length),B.end(),t.queue.submit([O.finish()]),requestAnimationFrame(l)}l()}
