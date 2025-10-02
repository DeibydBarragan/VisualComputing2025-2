// ===== SHADERS PROCEDURALES AVANZADOS =====

/**
 * Shader de damero con animación
 */
export const CheckerboardShader = {
    uniforms: {
        uTime: { value: 0.0 },
        uScale: { value: 8.0 },
        uColor1: { value: new THREE.Color(0xff6b6b) },
        uColor2: { value: new THREE.Color(0x4ecdc4) },
        uAnimSpeed: { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform float uScale;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uAnimSpeed;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            // Coordenadas animadas
            vec2 animatedUv = vUv + sin(uTime * uAnimSpeed) * 0.1;
            
            // Patrón de damero
            vec2 grid = floor(animatedUv * uScale);
            float checker = mod(grid.x + grid.y, 2.0);
            
            // Mezcla de colores
            vec3 color = mix(uColor1, uColor2, checker);
            
            // Efecto de pulso
            float pulse = sin(uTime * 2.0 * uAnimSpeed) * 0.1 + 0.9;
            color *= pulse;
            
            // Iluminación básica usando la normal
            float NdotL = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
            color *= 0.5 + 0.5 * NdotL;
            
            gl_FragColor = vec4(color, 1.0);
        }
    `
};

/**
 * Shader de ruido Perlin procedural
 */
export const NoiseShader = {
    uniforms: {
        uTime: { value: 0.0 },
        uScale: { value: 5.0 },
        uColor: { value: new THREE.Color(0x45b7d1) },
        uContrast: { value: 1.0 },
        uBrightness: { value: 0.5 }
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform float uScale;
        uniform vec3 uColor;
        uniform float uContrast;
        uniform float uBrightness;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        // Función hash para ruido
        vec3 hash(vec3 p) {
            p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                     dot(p, vec3(269.5, 183.3, 246.1)),
                     dot(p, vec3(113.5, 271.9, 124.6)));
            return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }
        
        // Ruido 3D
        float noise3D(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            vec3 u = f * f * (3.0 - 2.0 * f);
            
            return mix(mix(mix(dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
                               dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
                           mix(dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
                               dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y),
                       mix(mix(dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
                               dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
                           mix(dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
                               dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
        }
        
        // FBM (Fractional Brownian Motion)
        float fbm(vec3 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 0.0;
            
            for (int i = 0; i < 4; i++) {
                value += amplitude * noise3D(p);
                p *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }
        
        void main() {
            // Coordenadas 3D animadas
            vec3 pos = vPosition * uScale + uTime * 0.1;
            
            // Generar ruido
            float n = fbm(pos);
            n = uBrightness + uContrast * n;
            n = clamp(n, 0.0, 1.0);
            
            // Aplicar color
            vec3 color = uColor * n;
            
            // Iluminación básica
            float NdotL = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
            color *= 0.3 + 0.7 * (0.5 + 0.5 * NdotL);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `
};

/**
 * Shader de bandas con colores procedurales
 */
export const StripesShader = {
    uniforms: {
        uTime: { value: 0.0 },
        uStripeCount: { value: 10.0 },
        uColor1: { value: new THREE.Color(0x96CEB4) },
        uColor2: { value: new THREE.Color(0xFFEAA7) },
        uDirection: { value: new THREE.Vector2(1.0, 0.0) },
        uWaveAmplitude: { value: 0.1 }
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform float uStripeCount;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec2 uDirection;
        uniform float uWaveAmplitude;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
            // Coordenadas direccionales
            float coord = dot(vUv, uDirection);
            
            // Agregar ondas
            coord += sin(vUv.y * 10.0 + uTime * 2.0) * uWaveAmplitude;
            
            // Crear bandas
            float stripes = sin(coord * uStripeCount * 3.14159);
            float pattern = smoothstep(-0.1, 0.1, stripes);
            
            // Mezclar colores
            vec3 color = mix(uColor1, uColor2, pattern);
            
            // Animación de intensidad
            float intensity = 0.8 + 0.2 * sin(uTime * 3.0);
            color *= intensity;
            
            // Iluminación básica
            float NdotL = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
            color *= 0.4 + 0.6 * (0.5 + 0.5 * NdotL);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `
};

/**
 * Shader triplanar para texturas procedurales 3D
 */
export const TriplanarShader = {
    uniforms: {
        uTime: { value: 0.0 },
        uScale: { value: 2.0 },
        uColorX: { value: new THREE.Color(0xFF6B6B) },
        uColorY: { value: new THREE.Color(0x4ECDC4) },
        uColorZ: { value: new THREE.Color(0x45B7D1) },
        uBlendSharpness: { value: 1.0 }
    },
    vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        
        void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform float uScale;
        uniform vec3 uColorX;
        uniform vec3 uColorY;
        uniform vec3 uColorZ;
        uniform float uBlendSharpness;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        
        // Función de ruido simple para texturas
        float hash(float n) {
            return fract(sin(n) * 43758.5453);
        }
        
        float noise2D(vec2 x) {
            vec2 p = floor(x);
            vec2 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            
            float n = p.x + p.y * 57.0;
            return mix(mix(hash(n), hash(n + 1.0), f.x),
                      mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
        }
        
        void main() {
            // Coordenadas para cada plano
            vec2 uvX = vWorldPosition.yz * uScale;
            vec2 uvY = vWorldPosition.xz * uScale;
            vec2 uvZ = vWorldPosition.xy * uScale;
            
            // Agregar animación
            uvX += uTime * 0.1;
            uvY += uTime * 0.15;
            uvZ += uTime * 0.2;
            
            // Generar patrones para cada plano
            float patternX = noise2D(uvX);
            float patternY = noise2D(uvY);
            float patternZ = noise2D(uvZ);
            
            // Colores para cada plano
            vec3 colorX = uColorX * patternX;
            vec3 colorY = uColorY * patternY;
            vec3 colorZ = uColorZ * patternZ;
            
            // Pesos de mezcla basados en la normal
            vec3 blendWeights = abs(vNormal);
            blendWeights = pow(blendWeights, vec3(uBlendSharpness));
            blendWeights /= (blendWeights.x + blendWeights.y + blendWeights.z);
            
            // Mezclar colores
            vec3 color = colorX * blendWeights.x + 
                        colorY * blendWeights.y + 
                        colorZ * blendWeights.z;
            
            // Iluminación direccional
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            float NdotL = dot(vNormal, lightDir);
            color *= 0.3 + 0.7 * (0.5 + 0.5 * NdotL);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `
};

/**
 * Función helper para crear materiales con shaders procedurales
 */
export function createProceduralMaterial(shaderType, customUniforms = {}) {
    let shader;
    
    switch(shaderType) {
        case 'checkerboard':
            shader = CheckerboardShader;
            break;
        case 'noise':
            shader = NoiseShader;
            break;
        case 'stripes':
            shader = StripesShader;
            break;
        case 'triplanar':
            shader = TriplanarShader;
            break;
        default:
            console.warn(`Shader type '${shaderType}' not found`);
            return new THREE.MeshStandardMaterial();
    }
    
    // Mezclar uniforms personalizados
    const uniforms = { ...shader.uniforms };
    for (let key in customUniforms) {
        if (uniforms[key]) {
            uniforms[key].value = customUniforms[key];
        }
    }
    
    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader,
        side: THREE.DoubleSide
    });
}

/**
 * Función para actualizar uniforms de tiempo en shaders
 */
export function updateShaderTime(materials, elapsedTime) {
    Object.values(materials).forEach(material => {
        if (material.uniforms && material.uniforms.uTime) {
            material.uniforms.uTime.value = elapsedTime;
        }
    });
}

console.log('Shaders procedurales cargados correctamente');