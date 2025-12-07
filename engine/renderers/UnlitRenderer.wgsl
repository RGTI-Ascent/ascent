struct VertexInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(1) texcoords: vec2f,
}

struct FragmentInput {
    @location(1) texcoords: vec2f,
}

struct FragmentOutput {
    @location(0) color: vec4f,
}

struct CameraUniforms {
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
}

struct ModelUniforms {
    modelMatrix: mat4x4f,
    normalMatrix: mat3x3f,
}

struct MaterialUniforms {
    baseFactor: vec4f,
    uvScale: vec2f, // NEW: scale for UV tiling
    padding: vec2f,
}

@group(0) @binding(0) var<uniform> camera: CameraUniforms;

@group(1) @binding(0) var<uniform> model: ModelUniforms;

@group(2) @binding(0) var<uniform> material: MaterialUniforms;
@group(2) @binding(1) var baseTexture: texture_2d<f32>;
@group(2) @binding(2) var baseSampler: sampler;

@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    output.position = camera.projectionMatrix * camera.viewMatrix * model.modelMatrix * vec4(input.position, 1);
    output.texcoords = input.texcoords;

    return output;
}

@fragment
fn fragment(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    let baseColor = textureSample(baseTexture, baseSampler, input.texcoords * material.uvScale) * material.baseFactor;

        // Alpha test fix
    if (baseColor.a < 0.1) {
        discard;
    }

    // Compute brightness
    let brightness = max(max(baseColor.r, baseColor.g), baseColor.b);

    // Soft bloom factor
    let bloomFactor = smoothstep(0.3, 1.3, brightness); // adjust 0.5–1.0 as needed


    // Bloom contribution
    let bloomColor = baseColor.rgb * bloomFactor * 0.5; // tweak 0.5 intensity

    // Combine with original
    output.color = vec4(baseColor.rgb + bloomColor, baseColor.a);

    return output;
}
