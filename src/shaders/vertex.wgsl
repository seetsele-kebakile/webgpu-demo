struct Uniforms {
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
}