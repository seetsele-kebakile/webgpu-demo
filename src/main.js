//this is main.js
//import './style.css'

// Import shaders as raw text
import vertexShader from './shaders/vertex.wgsl?raw';
import fragmentShader from './shaders/fragment.wgsl?raw';
import { mat4 } from 'gl-matrix';

async function initWebGPU() {
  if (!navigator.gpu) {
    document.body.innerText = "WebGPU not supported!";
    return;
  }

  const canvas = document.getElementById('gpuCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format });

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  const depthView = depthTexture.createView();

  const vertices = new Float32Array([
    -0.5,-0.5,0.5, 1,0,0,
     0.5,-0.5,0.5, 0,1,0,
     0.5,0.5,0.5, 0,0,1,
    -0.5,0.5,0.5, 1,1,0,
    -0.5,-0.5,-0.5,0,1,1,
     0.5,-0.5,-0.5,1,0,1,
     0.5,0.5,-0.5,1,1,1,
    -0.5,0.5,-0.5,0,0,0
  ]);

  const indices = new Uint16Array([
     0,1,2, 0,2,3, // front (CCW)
  5,4,7, 5,7,6, // back (CCW) 
  4,0,3, 4,3,7, // left (CCW)
  1,5,6, 1,6,2, // right (CCW)
  3,2,6, 3,6,7, // top (CCW)
  4,5,1, 4,1,0  // bottom (CCW)
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  });
  device.queue.writeBuffer(indexBuffer, 0, indices);

  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [{ binding:0, visibility:GPUShaderStage.VERTEX, buffer:{ type:"uniform" } }]
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{ binding:0, resource:{ buffer:uniformBuffer } }]
  });

  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts:[bindGroupLayout] }),
    vertex: {
      module: device.createShaderModule({ code: vertexShader }),
      entryPoint: 'main',
      buffers: [{ 
        arrayStride: 24,
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x3' },
          { shaderLocation: 1, offset: 12, format: 'float32x3' }
        ]
      }]
    },
    fragment: {
      module: device.createShaderModule({ code: fragmentShader }),
      entryPoint:'main',
      targets:[{ format }]
    },
    primitive: { topology: 'triangle-list', cullMode: 'back' },
    depthStencil: {
      format: 'depth24plus',
      depthWriteEnabled: true,
      depthCompare: 'less',
    }
  });

  let angle = 0;
  function frame() {
    angle += 0.01;

    const aspect = canvas.width / canvas.height;
    const projection = mat4.create();
    mat4.perspective(projection, 45 * Math.PI/180, aspect, 0.1, 10);

    const modelView = mat4.create();
    mat4.translate(modelView, modelView, [0,0,-3]);
    mat4.rotateX(modelView, modelView, angle);
    mat4.rotateY(modelView, modelView, angle);

    const mvp = mat4.create();
    mat4.multiply(mvp, projection, modelView);

    device.queue.writeBuffer(uniformBuffer, 0, mvp);

    const encoder = device.createCommandEncoder();
    const view = context.getCurrentTexture().createView();
    const pass = encoder.beginRenderPass({
      colorAttachments:[{
        view,
        loadOp:'clear',
        storeOp:'store',
        clearValue:{r:0.1,g:0.1,b:0.1,a:1}
      }],
      depthStencilAttachment: {
        view: depthView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      }
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer,'uint16');
    pass.drawIndexed(indices.length);
    pass.end();

    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
  }

  frame();
}

initWebGPU();