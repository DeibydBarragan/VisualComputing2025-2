// ===== VARIABLES GLOBALES =====
let scene, renderer, perspectiveCamera, orthographicCamera, currentCamera;
let controls, stats;
let models = {};
let lights = {};
let materials = {};
let animations = {};
let clock = new THREE.Clock();
let isAnimating = true;

// Configuración de la escena
const SCENE_CONFIG = {
    background: 0x87CEEB, // Sky blue
    fog: {
        color: 0x87CEEB,
        near: 10,
        far: 100
    }
};

// Configuración de cámaras
const CAMERA_CONFIG = {
    perspective: {
        fov: 75,
        near: 0.1,
        far: 1000,
        position: { x: 10, y: 10, z: 10 }
    },
    orthographic: {
        left: -15,
        right: 15,
        top: 15,
        bottom: -15,
        near: 0.1,
        far: 1000,
        position: { x: 15, y: 15, z: 15 }
    }
};

// ===== INICIALIZACIÓN =====
async function init() {
    console.log('Iniciando mundo virtual...');
    
    // Crear escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_CONFIG.background);
    scene.fog = new THREE.Fog(SCENE_CONFIG.fog.color, SCENE_CONFIG.fog.near, SCENE_CONFIG.fog.far);

    // Crear renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    document.getElementById('container').appendChild(renderer.domElement);

    // Crear cámaras
    createCameras();
    
    // Configurar controles
    setupControls();
    
    // Crear iluminación
    setupLighting();
    
    // Cargar modelos GLB
    await loadGLBModels();
    
    // Crear materiales
    setupMaterials();
    
    // Configurar shaders procedurales
    setupProceduralShaders();
    
    // Configurar animaciones
    setupAnimations();
    
    // Configurar eventos de UI
    setupUI();
    
    // Iniciar render loop
    animate();
    
    // Ocultar loading
    document.getElementById('loading').style.display = 'none';
    
    console.log('Mundo virtual cargado exitosamente!');
}

// ===== CONFIGURACIÓN DE CÁMARAS =====
function createCameras() {
    // Cámara perspectiva
    perspectiveCamera = new THREE.PerspectiveCamera(
        CAMERA_CONFIG.perspective.fov,
        window.innerWidth / window.innerHeight,
        CAMERA_CONFIG.perspective.near,
        CAMERA_CONFIG.perspective.far
    );
    perspectiveCamera.position.set(
        CAMERA_CONFIG.perspective.position.x,
        CAMERA_CONFIG.perspective.position.y,
        CAMERA_CONFIG.perspective.position.z
    );

    // Cámara ortográfica
    const aspect = window.innerWidth / window.innerHeight;
    orthographicCamera = new THREE.OrthographicCamera(
        CAMERA_CONFIG.orthographic.left * aspect,
        CAMERA_CONFIG.orthographic.right * aspect,
        CAMERA_CONFIG.orthographic.top,
        CAMERA_CONFIG.orthographic.bottom,
        CAMERA_CONFIG.orthographic.near,
        CAMERA_CONFIG.orthographic.far
    );
    orthographicCamera.position.set(
        CAMERA_CONFIG.orthographic.position.x,
        CAMERA_CONFIG.orthographic.position.y,
        CAMERA_CONFIG.orthographic.position.z
    );

    // Establecer cámara inicial
    currentCamera = perspectiveCamera;
}

// ===== CONTROLES =====
function setupControls() {
    controls = new THREE.OrbitControls(currentCamera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI;
}

// ===== SISTEMA DE ILUMINACIÓN =====
function setupLighting() {
    // Luz ambiental suave
    lights.ambient = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(lights.ambient);

    // Key Light (Luz principal)
    lights.key = new THREE.DirectionalLight(0xffffff, 1.2);
    lights.key.position.set(10, 15, 5);
    lights.key.castShadow = true;
    lights.key.shadow.mapSize.width = 2048;
    lights.key.shadow.mapSize.height = 2048;
    lights.key.shadow.camera.near = 0.5;
    lights.key.shadow.camera.far = 50;
    lights.key.shadow.camera.left = -20;
    lights.key.shadow.camera.right = 20;
    lights.key.shadow.camera.top = 20;
    lights.key.shadow.camera.bottom = -20;
    scene.add(lights.key);

    // Fill Light (Luz de relleno)
    lights.fill = new THREE.DirectionalLight(0x87CEEB, 0.6);
    lights.fill.position.set(-5, 5, -5);
    scene.add(lights.fill);

    // Rim Light (Luz de contorno)
    lights.rim = new THREE.PointLight(0xffa500, 0.8, 30);
    lights.rim.position.set(0, 8, -10);
    scene.add(lights.rim);

    // Helper para visualizar luces (opcional)
    const keyHelper = new THREE.DirectionalLightHelper(lights.key, 2);
    const rimHelper = new THREE.PointLightHelper(lights.rim, 1);
    // scene.add(keyHelper, rimHelper); // Descomenta para ver helpers
}

// ===== CARGA DE MODELOS GLB =====
async function loadGLBModels() {
    // Crear loader de GLB
    const loader = new THREE.GLTFLoader();
    
    // Suelo con textura de concreto procedural
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = createConcreteTexture();
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    try {
        // Cargar Porsche (modelo utilitario - vehículo)
        console.log('Intentando cargar Porsche...');
        const porscheGLTF = await new Promise((resolve, reject) => {
            loader.load('./porsche.glb', resolve, 
                (progress) => console.log('Cargando Porsche:', (progress.loaded / progress.total * 100).toFixed(1) + '%'),
                reject
            );
        });
        
        models.porsche = porscheGLTF.scene;
        models.porsche.position.set(8, 0, 3);  // Esquina frontal derecha
        models.porsche.scale.setScalar(1.5);
        
        // Configurar sombras para el Porsche
        models.porsche.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Asegurar materiales PBR
                if (child.material) {
                    child.material.envMapIntensity = 1.0;
                }
            }
        });
        
        scene.add(models.porsche);
        console.log('Porsche cargado exitosamente');

        // Cargar Shiba (modelo orgánico - perro)
        console.log('Intentando cargar Shiba...');
        const shibaGLTF = await new Promise((resolve, reject) => {
            loader.load('./shiba.glb', resolve,
                (progress) => console.log('Cargando Shiba:', (progress.loaded / progress.total * 100).toFixed(1) + '%'),
                reject
            );
        });
        
        models.shiba = shibaGLTF.scene;
        models.shiba.position.set(-6, 2, -5);  // Subido 2 unidades más (de -1 a 1)
        models.shiba.scale.setScalar(2);
        
        // Configurar sombras para el Shiba
        models.shiba.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.roughness = 0.8;
                    child.material.metalness = 0.0;
                }
            }
        });
        
        scene.add(models.shiba);
        console.log('Shiba cargado exitosamente');

        // Cargar Miyu (modelo arquitectónico/personaje)
        console.log('Intentando cargar Miyu...');
        const miyuGLTF = await new Promise((resolve, reject) => {
            loader.load('./miyu.glb', resolve,
                (progress) => console.log('Cargando Miyu:', (progress.loaded / progress.total * 100).toFixed(1) + '%'),
                reject
            );
        });
        
        models.miyu = miyuGLTF.scene;
        models.miyu.position.set(2, 0, -8);  // Centro trasero profundo
        models.miyu.scale.setScalar(2.5);  // Hacer Miyu más grande
        
        // Configurar sombras para Miyu
        models.miyu.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.roughness = 0.5;
                    child.material.metalness = 0.0;
                }
            }
        });
        
        scene.add(models.miyu);
        console.log('Miyu cargado exitosamente');

        // Agregar figuras adicionales con texturas especiales
        createAdditionalObjects();

        // Configurar animaciones si existen
        if (shibaGLTF.animations && shibaGLTF.animations.length > 0) {
            models.shibaMixer = new THREE.AnimationMixer(models.shiba);
            const action = models.shibaMixer.clipAction(shibaGLTF.animations[0]);
            action.play();
        }

        if (miyuGLTF.animations && miyuGLTF.animations.length > 0) {
            models.miyuMixer = new THREE.AnimationMixer(models.miyu);
            const action = models.miyuMixer.clipAction(miyuGLTF.animations[0]);
            action.play();
        }

    } catch (error) {
        console.error('Error cargando modelos GLB:', error);
        // Fallback a geometrías básicas si hay error
        createFallbackGeometry();
    }
}

// Función fallback en caso de error cargando GLB
function createFallbackGeometry() {
    console.log('Usando geometrías básicas como fallback');
    
    // Cubo como fallback del Porsche
    const cubeGeometry = new THREE.BoxGeometry(2, 1, 4);
    const cubeMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.1,
        metalness: 0.8
    });
    models.porsche = new THREE.Mesh(cubeGeometry, cubeMaterial);
    models.porsche.position.set(-5, 0.5, 0);
    models.porsche.castShadow = true;
    scene.add(models.porsche);

    // Esfera como fallback del Shiba
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4a574,
        roughness: 0.8,
        metalness: 0.0
    });
    models.shiba = new THREE.Mesh(sphereGeometry, sphereMaterial);
    models.shiba.position.set(5, 1, 0);
    models.shiba.castShadow = true;
    scene.add(models.shiba);

    // Cilindro como fallback de Miyu
    const cylinderGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
    const cylinderMaterial = new THREE.MeshStandardMaterial({
        color: 0xffb3d9,
        roughness: 0.4,
        metalness: 0.0
    });
    models.miyu = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    models.miyu.position.set(0, 1.5, -4);
    models.miyu.castShadow = true;
    scene.add(models.miyu);
}

// ===== MATERIALES PBR =====
function setupMaterials() {
    // Material metálico
    materials.metallic = new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 0.1,
        metalness: 0.9,
        envMapIntensity: 1.0
    });

    // Material orgánico
    materials.organic = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0.0,
        normalScale: new THREE.Vector2(1, 1)
    });

    // Material cerámico
    materials.ceramic = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1
    });
}

// ===== SHADERS PROCEDURALES =====
function setupProceduralShaders() {
    // Shader de damero
    materials.checkerboard = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uScale: { value: 8.0 },
            uColor1: { value: new THREE.Color(0xff6b6b) },
            uColor2: { value: new THREE.Color(0x4ecdc4) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uScale;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vec2 grid = floor(vUv * uScale);
                float checker = mod(grid.x + grid.y, 2.0);
                
                vec3 color = mix(uColor1, uColor2, checker);
                
                // Animación sutil
                float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
                color *= pulse;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `
    });

    // Shader de ruido
    materials.noise = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uScale: { value: 5.0 },
            uColor: { value: new THREE.Color(0x45b7d1) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uScale;
            uniform vec3 uColor;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            // Función de ruido simple
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                
                vec2 u = f * f * (3.0 - 2.0 * f);
                
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            void main() {
                vec2 st = vUv * uScale;
                
                float n = noise(st + uTime * 0.5);
                vec3 color = uColor * (0.5 + 0.5 * n);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `
    });
}

// ===== ANIMACIONES =====
function setupAnimations() {
    animations.cameraPath = {
        active: false,
        progress: 0,
        duration: 10, // segundos
        path: [
            { x: 10, y: 10, z: 10 },
            { x: -10, y: 15, z: 5 },
            { x: 0, y: 20, z: -10 },
            { x: 15, y: 8, z: 8 }
        ]
    };
}

// ===== PRESETS DE ILUMINACIÓN =====
function setLightingPreset(preset) {
    switch(preset) {
        case 'day':
            lights.key.color.setHex(0xffffff);
            lights.key.intensity = 1.2;
            lights.fill.color.setHex(0x87CEEB);
            lights.fill.intensity = 0.6;
            lights.rim.color.setHex(0xffa500);
            lights.rim.intensity = 0.8;
            lights.ambient.intensity = 0.4;
            scene.background.setHex(0x87CEEB);
            break;
            
        case 'sunset':
            lights.key.color.setHex(0xff6b47);
            lights.key.intensity = 0.8;
            lights.fill.color.setHex(0xff9500);
            lights.fill.intensity = 0.4;
            lights.rim.color.setHex(0xff4757);
            lights.rim.intensity = 1.2;
            lights.ambient.intensity = 0.2;
            scene.background.setHex(0x2c1810);
            break;
            
        case 'night':
            lights.key.color.setHex(0x70a1ff);
            lights.key.intensity = 0.3;
            lights.fill.color.setHex(0x3742fa);
            lights.fill.intensity = 0.2;
            lights.rim.color.setHex(0x5352ed);
            lights.rim.intensity = 1.5;
            lights.ambient.intensity = 0.1;
            scene.background.setHex(0x0a0a0a);
            break;
    }
}

// ===== CONFIGURACIÓN DE UI =====
function setupUI() {
    // Cambio de cámaras
    document.getElementById('perspectiveBtn').addEventListener('click', () => {
        switchCamera('perspective');
    });
    
    document.getElementById('orthographicBtn').addEventListener('click', () => {
        switchCamera('orthographic');
    });

    // Presets de iluminación
    document.getElementById('dayLighting').addEventListener('click', () => {
        setLightingPreset('day');
        updateActiveButton('dayLighting', ['dayLighting', 'sunsetLighting', 'nightLighting']);
    });
    
    document.getElementById('sunsetLighting').addEventListener('click', () => {
        setLightingPreset('sunset');
        updateActiveButton('sunsetLighting', ['dayLighting', 'sunsetLighting', 'nightLighting']);
    });
    
    document.getElementById('nightLighting').addEventListener('click', () => {
        setLightingPreset('night');
        updateActiveButton('nightLighting', ['dayLighting', 'sunsetLighting', 'nightLighting']);
    });

    // Control de animaciones
    document.getElementById('toggleAnimation').addEventListener('click', () => {
        isAnimating = !isAnimating;
    });
    
    document.getElementById('cameraAnimation').addEventListener('click', () => {
        startCameraAnimation();
    });

    // Materiales
    document.getElementById('pbrMaterials').addEventListener('click', () => {
        applyPBRMaterials();
        updateActiveButton('pbrMaterials', ['pbrMaterials', 'proceduralMaterials', 'mixedMaterials']);
    });
    
    document.getElementById('proceduralMaterials').addEventListener('click', () => {
        applyProceduralMaterials();
        updateActiveButton('proceduralMaterials', ['pbrMaterials', 'proceduralMaterials', 'mixedMaterials']);
    });
    
    document.getElementById('mixedMaterials').addEventListener('click', () => {
        applyMixedMaterials();
        updateActiveButton('mixedMaterials', ['pbrMaterials', 'proceduralMaterials', 'mixedMaterials']);
    });

    // Controles de PBR
    const roughnessSlider = document.getElementById('roughnessSlider');
    const metalnessSlider = document.getElementById('metalnessSlider');
    
    roughnessSlider.addEventListener('input', (e) => {
        updateMaterialProperty('roughness', parseFloat(e.target.value));
        document.getElementById('roughnessValue').textContent = e.target.value;
    });
    
    metalnessSlider.addEventListener('input', (e) => {
        updateMaterialProperty('metalness', parseFloat(e.target.value));
        document.getElementById('metalnessValue').textContent = e.target.value;
    });

    // Paleta de colores
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            applyColorToScene(color);
        });
    });
}

// ===== FUNCIONES DE UTILIDAD =====
function switchCamera(type) {
    if (type === 'perspective') {
        currentCamera = perspectiveCamera;
        updateActiveButton('perspectiveBtn', ['perspectiveBtn', 'orthographicBtn']);
    } else {
        currentCamera = orthographicCamera;
        updateActiveButton('orthographicBtn', ['perspectiveBtn', 'orthographicBtn']);
    }
    
    controls.object = currentCamera;
    controls.update();
}

function updateActiveButton(activeId, allIds) {
    allIds.forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    document.getElementById(activeId).classList.add('active');
}

function applyPBRMaterials() {
    // Aplicar material metálico al Porsche (vehículo)
    if (models.porsche) {
        models.porsche.traverse((child) => {
            if (child.isMesh) {
                child.material = materials.metallic.clone();
                child.material.color.setHex(0xff0000); // Rojo para el Porsche
            }
        });
    }
    
    // Aplicar material orgánico al Shiba (perro)
    if (models.shiba) {
        models.shiba.traverse((child) => {
            if (child.isMesh) {
                child.material = materials.organic.clone();
                child.material.color.setHex(0xd4a574); // Color de pelaje
            }
        });
    }
    
    // Aplicar material cerámico a Miyu (personaje)
    if (models.miyu) {
        models.miyu.traverse((child) => {
            if (child.isMesh) {
                child.material = materials.ceramic.clone();
                child.material.color.setHex(0xffb3d9); // Rosa suave
            }
        });
    }
    
    // Aplicar materiales a objetos adicionales
    if (models.floatingSphere) {
        models.floatingSphere.material = materials.organic.clone();
        models.floatingSphere.material.color.setHex(0x8B0000);
    }
    
    if (models.bigCube) {
        models.bigCube.material = materials.metallic.clone();
        models.bigCube.material.color.setHex(0x444444);
    }
}

function applyProceduralMaterials() {
    // Aplicar shader de damero al Porsche
    if (models.porsche) {
        models.porsche.traverse((child) => {
            if (child.isMesh) {
                child.material = materials.checkerboard;
            }
        });
    }
    
    // Aplicar shader de ruido al Shiba
    if (models.shiba) {
        models.shiba.traverse((child) => {
            if (child.isMesh) {
                child.material = materials.noise;
            }
        });
    }
    
    // Aplicar shader de damero a Miyu
    if (models.miyu) {
        models.miyu.traverse((child) => {
            if (child.isMesh) {
                child.material = materials.checkerboard;
            }
        });
    }
    
    // Aplicar shaders a objetos adicionales
    if (models.floatingSphere) {
        models.floatingSphere.material = materials.noise;
    }
    
    if (models.bigCube) {
        models.bigCube.material = materials.checkerboard;
    }
}

function applyMixedMaterials() {
    // Mezcla: PBR para Porsche, Shader para Shiba y Miyu
    if (models.porsche) {
        models.porsche.traverse((child) => {
            if (child.isMesh) {
                child.material = materials.metallic.clone();
                child.material.color.setHex(0x333333); // Gris oscuro metálico
            }
        });
    }
    
    if (models.shiba) {
        models.shiba.traverse((child) => {
            if (child.isMesh) {
                child.material = materials.noise;
            }
        });
    }
    
    if (models.miyu) {
        models.miyu.traverse((child) => {
            if (child.isMesh) {
                child.material = materials.checkerboard;
            }
        });
    }
    
    // Aplicar materiales mixtos a objetos adicionales  
    if (models.floatingSphere) {
        models.floatingSphere.material = createVelvetTexture();
    }
    
    if (models.bigCube) {
        models.bigCube.material = materials.metallic.clone();
    }
}

function updateMaterialProperty(property, value) {
    Object.values(models).forEach(model => {
        if (model && model.traverse) {
            model.traverse((child) => {
                if (child.isMesh && child.material && child.material[property] !== undefined) {
                    child.material[property] = value;
                }
            });
        }
    });
}

function applyColorToScene(hexColor) {
    const color = new THREE.Color(hexColor);
    
    // Aplicar color a los materiales de los modelos GLB
    Object.values(models).forEach((model, index) => {
        if (model && model.traverse) {
            model.traverse((child) => {
                if (child.isMesh && child.material && child.material.color) {
                    // Aplicar variaciones del color seleccionado
                    const hsl = {};
                    color.getHSL(hsl);
                    const newColor = new THREE.Color().setHSL(
                        (hsl.h + index * 0.15) % 1,
                        hsl.s * 0.8,
                        hsl.l
                    );
                    child.material.color.copy(newColor);
                }
            });
        }
    });
}

function startCameraAnimation() {
    animations.cameraPath.active = true;
    animations.cameraPath.progress = 0;
}

// ===== TEXTURAS PROCEDURALES AVANZADAS =====
function createConcreteTexture() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uScale: { value: 8.0 },
            uRoughness: { value: 0.9 }
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
            uniform float uScale;
            uniform float uRoughness;
            varying vec2 vUv;
            varying vec3 vNormal;
            
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            void main() {
                vec2 st = vUv * uScale;
                float n = noise(st);
                float n2 = noise(st * 2.0) * 0.5;
                float n3 = noise(st * 4.0) * 0.25;
                
                float finalNoise = (n + n2 + n3) / 1.75;
                
                // Color base de concreto
                vec3 baseColor = vec3(0.6, 0.6, 0.65);
                vec3 darkColor = vec3(0.4, 0.4, 0.45);
                
                vec3 color = mix(darkColor, baseColor, finalNoise);
                
                // Iluminación básica
                float NdotL = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
                color *= 0.4 + 0.6 * (0.5 + 0.5 * NdotL);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `
    });
}

function createVelvetTexture() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uColor: { value: new THREE.Color(0x8B0000) }
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
            uniform vec3 uColor;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            void main() {
                // Efecto aterciopelado con variación sutil
                vec2 st = vUv * 50.0;
                float noise = random(floor(st)) * 0.1;
                
                vec3 color = uColor + noise;
                
                // Efecto velvet con iluminación suave
                vec3 viewDir = normalize(-vPosition);
                float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
                color += fresnel * 0.2;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `
    });
}

function createWallCladdingTexture() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uScale: { value: 4.0 }
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
            uniform float uScale;
            varying vec2 vUv;
            varying vec3 vNormal;
            
            void main() {
                vec2 st = vUv * uScale;
                
                // Patrón de revestimiento de pared
                vec2 grid = floor(st);
                vec2 fract_st = fract(st);
                
                float pattern = step(0.1, fract_st.x) * step(0.1, fract_st.y) * 
                               step(fract_st.x, 0.9) * step(fract_st.y, 0.9);
                
                // Alternar colores de ladrillo
                float checker = mod(grid.x + grid.y, 2.0);
                vec3 color1 = vec3(0.8, 0.7, 0.6); // Beige claro
                vec3 color2 = vec3(0.7, 0.6, 0.5); // Beige oscuro
                
                vec3 brickColor = mix(color1, color2, checker);
                vec3 mortarColor = vec3(0.9, 0.9, 0.9); // Mortero blanco
                
                vec3 finalColor = mix(mortarColor, brickColor, pattern);
                
                // Iluminación
                float NdotL = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
                finalColor *= 0.5 + 0.5 * (0.5 + 0.5 * NdotL);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    });
}

function createAdditionalObjects() {
    // Pilares redistribuidos por el espacio
    const pillarGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
    const pillarMaterial = createWallCladdingTexture();
    const pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar1.position.set(-10, 3, 5);  // Subido 1 unidad más (total 3)
    pillar1.castShadow = true;
    pillar1.receiveShadow = true;
    scene.add(pillar1);
    models.pillar1 = pillar1;
    
    const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar2.position.set(12, 3, -10);  // Subido 1 unidad más (total 3)
    pillar2.castShadow = true;
    pillar2.receiveShadow = true;
    scene.add(pillar2);
    models.pillar2 = pillar2;
    
    // Esfera flotante reposicionada
    const sphereGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const sphereMaterial = createVelvetTexture();
    const floatingSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    floatingSphere.position.set(5, 2, -5);  // Subido 2 unidades
    floatingSphere.castShadow = true;
    scene.add(floatingSphere);
    models.floatingSphere = floatingSphere;
    
    // Cubo grande reposicionado
    const bigCubeGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    const bigCubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 1.0
    });
    const bigCube = new THREE.Mesh(bigCubeGeometry, bigCubeMaterial);
    bigCube.position.set(-3, 2, 8);  // Subido 2 unidades
    bigCube.castShadow = true;
    bigCube.receiveShadow = true;
    scene.add(bigCube);
    models.bigCube = bigCube;
    
    // Toro decorativo reposicionado
    const torusGeometry = new THREE.TorusGeometry(1.5, 0.4, 16, 100);
    const torusMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.set(0, 1, 6);  // Subido 1 unidad
    torus.rotation.x = Math.PI / 3;
    torus.rotation.z = Math.PI / 6;
    torus.castShadow = true;
    scene.add(torus);
    models.torus = torus;
    
    // Agregar más objetos para llenar el espacio
    
    // Pirámide cristalina
    const pyramidGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const pyramidMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        metalness: 0.3,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8
    });
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.position.set(-8, 3, -5);  // Subido 1 unidad más (total 3)
    pyramid.castShadow = true;
    pyramid.receiveShadow = true;
    scene.add(pyramid);
    models.pyramid = pyramid;
    
    // Conjunto de cubos pequeños
    const smallCubeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    for (let i = 0; i < 5; i++) {
        const smallCubeMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(i * 0.2, 0.7, 0.6),
            metalness: 0.4,
            roughness: 0.6
        });
        const smallCube = new THREE.Mesh(smallCubeGeometry, smallCubeMaterial);
        smallCube.position.set(
            10 + (i * 1.2), 
            1.4, 
            -3 + (i * 0.8)
        );
        smallCube.castShadow = true;
        smallCube.receiveShadow = true;
        scene.add(smallCube);
        models[`smallCube${i}`] = smallCube;
    }
    
    // Anillo flotante
    const ringGeometry = new THREE.RingGeometry(2, 2.5, 16);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        side: THREE.DoubleSide,
        metalness: 0.5,
        roughness: 0.3
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(-2, 3, 0);  // Subido 1 unidad más (total 3)
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    scene.add(ring);
    models.ring = ring;
    
    console.log('Objetos adicionales creados con texturas especiales');
}

// ===== LOOP DE ANIMACIÓN =====
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    
    if (isAnimating) {
        // Animar Porsche (rotación suave)
        if (models.porsche) {
            models.porsche.rotation.y += deltaTime * 0.3;
        }
        
        // Animar Shiba (movimiento vertical ondulante - elevado sobre el suelo)
        if (models.shiba) {
            models.shiba.position.y = 2 + Math.sin(elapsedTime * 2) * 0.4;
            models.shiba.rotation.y = Math.sin(elapsedTime * 1.5) * 0.2;
        }
        
        // Animar Miyu (rotación lenta - ahora más grande)
        if (models.miyu) {
            models.miyu.rotation.y += deltaTime * 0.5;
        }
        
        // Animar objetos adicionales
        if (models.floatingSphere) {
            models.floatingSphere.position.y = 2 + Math.sin(elapsedTime * 1.5) * 0.5;
            models.floatingSphere.rotation.x += deltaTime * 0.3;
            models.floatingSphere.rotation.z += deltaTime * 0.2;
        }
        
        if (models.bigCube) {
            models.bigCube.rotation.x += deltaTime * 0.4;
            models.bigCube.rotation.y += deltaTime * 0.3;
        }
        
        if (models.torus) {
            models.torus.rotation.z += deltaTime * 0.6;
            models.torus.rotation.y += deltaTime * 0.2;
        }
        
        // Animar nuevos objetos
        if (models.pyramid) {
            models.pyramid.rotation.y += deltaTime * 0.8;
            models.pyramid.position.y = 3 + Math.sin(elapsedTime * 1.2) * 0.3;
        }
        
        if (models.ring) {
            models.ring.rotation.z += deltaTime * 0.5;
            models.ring.position.y = 3 + Math.sin(elapsedTime * 0.8) * 0.4;
        }
        
        // Animar cubos pequeños con movimiento en ola
        for (let i = 0; i < 5; i++) {
            if (models[`smallCube${i}`]) {
                models[`smallCube${i}`].position.y = 1.4 + Math.sin(elapsedTime * 2 + i * 0.5) * 0.2;
                models[`smallCube${i}`].rotation.x += deltaTime * (0.5 + i * 0.1);
                models[`smallCube${i}`].rotation.y += deltaTime * (0.3 + i * 0.1);
            }
        }
        
        // Actualizar mixers de animación si existen
        if (models.shibaMixer) {
            models.shibaMixer.update(deltaTime);
        }
        
        if (models.miyuMixer) {
            models.miyuMixer.update(deltaTime);
        }
        
        // Animar luces
        lights.rim.position.x = Math.cos(elapsedTime) * 8;
        lights.rim.position.z = Math.sin(elapsedTime) * 8;
        
        // Actualizar shaders procedurales
        if (materials.checkerboard && materials.checkerboard.uniforms) {
            materials.checkerboard.uniforms.uTime.value = elapsedTime;
        }
        
        if (materials.noise && materials.noise.uniforms) {
            materials.noise.uniforms.uTime.value = elapsedTime;
        }
        
        // Actualizar shaders de texturas personalizadas
        scene.traverse((object) => {
            if (object.material && object.material.uniforms && object.material.uniforms.uTime) {
                object.material.uniforms.uTime.value = elapsedTime;
            }
        });
        
        // Animación de cámara
        if (animations.cameraPath.active) {
            animations.cameraPath.progress += deltaTime / animations.cameraPath.duration;
            
            if (animations.cameraPath.progress >= 1) {
                animations.cameraPath.active = false;
                animations.cameraPath.progress = 0;
            } else {
                // Interpolación entre puntos del path
                const pathLength = animations.cameraPath.path.length;
                const segmentProgress = animations.cameraPath.progress * (pathLength - 1);
                const segmentIndex = Math.floor(segmentProgress);
                const localProgress = segmentProgress - segmentIndex;
                
                if (segmentIndex < pathLength - 1) {
                    const start = animations.cameraPath.path[segmentIndex];
                    const end = animations.cameraPath.path[segmentIndex + 1];
                    
                    currentCamera.position.lerpVectors(
                        new THREE.Vector3(start.x, start.y, start.z),
                        new THREE.Vector3(end.x, end.y, end.z),
                        localProgress
                    );
                }
            }
        }
    }
    
    // Actualizar controles
    controls.update();
    
    // Renderizar
    renderer.render(scene, currentCamera);
}

// ===== MANEJO DE REDIMENSIÓN =====
function onWindowResize() {
    // Actualizar cámaras
    const aspect = window.innerWidth / window.innerHeight;
    
    perspectiveCamera.aspect = aspect;
    perspectiveCamera.updateProjectionMatrix();
    
    orthographicCamera.left = CAMERA_CONFIG.orthographic.left * aspect;
    orthographicCamera.right = CAMERA_CONFIG.orthographic.right * aspect;
    orthographicCamera.updateProjectionMatrix();
    
    // Actualizar renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== EVENT LISTENERS =====
window.addEventListener('resize', onWindowResize, false);

// ===== INICIALIZACIÓN AL CARGAR LA PÁGINA =====
window.addEventListener('DOMContentLoaded', init);

console.log('Archivo main.js cargado - Listo para crear tu mundo virtual!');