@group(0) @binding(1) var mySampler: sampler;
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
}