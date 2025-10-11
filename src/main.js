//this is main.js
import './style.css'

import vertexShader from './shaders/vertex.wgsl?raw';
import fragmentShader from './shaders/fragment.wgsl?raw';
import { mat4 } from 'gl-matrix';

const startButton = document.getElementById('startButton');
const audioOverlay = document.getElementById('audioOverlay');
const errorMessage = document.getElementById('errorMessage');
const canvas = document.getElementById('gpuCanvas');

let audioContext;
let analyser;

async function setupAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);
    return true;
  } catch (err) {
    errorMessage.innerHTML = `
      <strong>Error:</strong> Microphone access failed.<br>
      If you're inside an app like LinkedIn, please open this page in your main browser (Chrome, Safari, etc.) to grant permission.
    `;
    console.error("Error accessing microphone:", err);
    return false;
  }
}

async function startExperience() {
  const audioReady = await setupAudio();
  if (!audioReady) {
    startButton.disabled = false;
    return;
  }

  audioOverlay.style.display = 'none';
  canvas.style.display = 'block';

  await initWebGPU();
}

startButton.addEventListener('click', () => {
    startButton.disabled = true;
    errorMessage.textContent = "Requesting microphone access...";
    startExperience();
});


async function initWebGPU() {
  if (!navigator.gpu) {
    document.body.innerHTML = "<h1>WebGPU not supported!</h1>";
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format });

  let depthTexture, depthView;

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (depthTexture) {
        depthTexture.destroy();
    }
    depthTexture = device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    depthView = depthTexture.createView();
  };
  
  handleResize();
  window.addEventListener('resize', handleResize);


  const timeDomainDataArray = new Float32Array(analyser.fftSize);

  // Cube vertices with proper PER-FACE tangents
  // Format: pos(3) uv(2) normal(3) tangent(3)
  const vertices = new Float32Array([
    // FRONT face (+Z): tangent points right (+X)
    -0.5, -0.5, 0.5, 0, 1,   0, 0, 1,   1, 0, 0,
     0.5, -0.5, 0.5, 1, 1,   0, 0, 1,   1, 0, 0,
     0.5,  0.5, 0.5, 1, 0,   0, 0, 1,   1, 0, 0,
    -0.5,  0.5, 0.5, 0, 0,   0, 0, 1,   1, 0, 0,
    
    // BACK face (-Z): tangent points left (-X)
    -0.5, -0.5,-0.5, 1, 1,   0, 0,-1,  -1, 0, 0,
     0.5, -0.5,-0.5, 0, 1,   0, 0,-1,  -1, 0, 0,
     0.5,  0.5,-0.5, 0, 0,   0, 0,-1,  -1, 0, 0,
    -0.5,  0.5,-0.5, 1, 0,   0, 0,-1,  -1, 0, 0,
    
    // TOP face (+Y): tangent points right (+X)
    -0.5,  0.5,-0.5, 0, 1,   0, 1, 0,   1, 0, 0,
     0.5,  0.5,-0.5, 1, 1,   0, 1, 0,   1, 0, 0,
     0.5,  0.5, 0.5, 1, 0,   0, 1, 0,   1, 0, 0,
    -0.5,  0.5, 0.5, 0, 0,   0, 1, 0,   1, 0, 0,
    
    // BOTTOM face (-Y): tangent points right (+X)
    -0.5, -0.5,-0.5, 0, 0,   0,-1, 0,   1, 0, 0,
     0.5, -0.5,-0.5, 1, 0,   0,-1, 0,   1, 0, 0,
     0.5, -0.5, 0.5, 1, 1,   0,-1, 0,   1, 0, 0,
    -0.5, -0.5, 0.5, 0, 1,   0,-1, 0,   1, 0, 0,
    
    // RIGHT face (+X): tangent points back (-Z)
     0.5, -0.5,-0.5, 1, 1,   1, 0, 0,   0, 0,-1,
     0.5,  0.5,-0.5, 1, 0,   1, 0, 0,   0, 0,-1,
     0.5,  0.5, 0.5, 0, 0,   1, 0, 0,   0, 0,-1,
     0.5, -0.5, 0.5, 0, 1,   1, 0, 0,   0, 0,-1,
    
    // LEFT face (-X): tangent points forward (+Z)
    -0.5, -0.5,-0.5, 0, 1,  -1, 0, 0,   0, 0, 1,
    -0.5,  0.5,-0.5, 0, 0,  -1, 0, 0,   0, 0, 1,
    -0.5,  0.5, 0.5, 1, 0,  -1, 0, 0,   0, 0, 1,
    -0.5, -0.5, 0.5, 1, 1,  -1, 0, 0,   0, 0, 1,
  ]);

  const indices = new Uint16Array([
    0,  1,  2,   0,  2,  3,  // Front
    4,  7,  6,   4,  6,  5,  // Back
    8, 11, 10,  8, 10,  9,  // Top
    12, 15, 14, 12, 14, 13, // Bottom
    16, 19, 18, 16, 18, 17, // Right
    20, 23, 22, 20, 22, 21, // Left
  ]);

  const vertexBuffer = device.createBuffer({ size: vertices.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  const indexBuffer = device.createBuffer({ size: indices.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(indexBuffer, 0, indices);

  const uniformBuffer = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

  async function loadImageAndCreateTexture(url) {
    const img = document.createElement('img');
    img.src = url;
    await img.decode();
    const imageBitmap = await createImageBitmap(img);

    const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture }, [imageBitmap.width, imageBitmap.height]);
    return texture;
  }
  
  const [colorTexture, normalTexture, bumpTexture] = await Promise.all([
    loadImageAndCreateTexture('crate1_diffuse.png'),
    loadImageAndCreateTexture('crate1_normal.png'),
    loadImageAndCreateTexture('crate1_bump.png'),
  ]);

  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
      { binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
    ]
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: colorTexture.createView() },
      { binding: 3, resource: normalTexture.createView() },
      { binding: 4, resource: bumpTexture.createView() },
    ]
  });

  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: device.createShaderModule({ code: vertexShader }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 11 * 4,
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x3' },
          { shaderLocation: 1, offset: 3 * 4, format: 'float32x2' },
          { shaderLocation: 2, offset: 5 * 4, format: 'float32x3' },
          { shaderLocation: 3, offset: 8 * 4, format: 'float32x3' },
        ]
      }]
    },
    fragment: {
      module: device.createShaderModule({ code: fragmentShader }),
      entryPoint: 'main',
      targets: [{ format }]
    },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' }
  });

  let angle = 0;
  function frame() {
    analyser.getFloatTimeDomainData(timeDomainDataArray);
    let sumSquares = 0.0;
    for (const amplitude of timeDomainDataArray) {
        sumSquares += amplitude * amplitude;
    }
    const amplitude = Math.sqrt(sumSquares / timeDomainDataArray.length);

    const rotationSpeed = 0.01 + (amplitude * 5.0);
    angle += rotationSpeed;
    
    const aspect = canvas.width / canvas.height;
    const projection = mat4.create();
    mat4.perspective(projection, 45 * Math.PI / 180, aspect, 0.1, 10);

    const modelView = mat4.create();
    mat4.translate(modelView, modelView, [0, 0, -4]);
    mat4.rotateX(modelView, modelView, angle * 0.5);
    mat4.rotateY(modelView, modelView, angle);

    const mvp = mat4.create();
    mat4.multiply(mvp, projection, modelView);

    device.queue.writeBuffer(uniformBuffer, 0, mvp);

    const encoder = device.createCommandEncoder();
    const view = context.getCurrentTexture().createView();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{ view, loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1 } }],
      depthStencilAttachment: {
        view: depthView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, 'uint16');
    pass.drawIndexed(indices.length);
    pass.end();

    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
  }

  frame();
}