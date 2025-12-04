import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// =============================================
// CONFIGURACIÓN INICIAL
// =============================================

// Variables globales
let scene, renderer, currentCamera;
let camera1, camera2, camera3; // Múltiples perspectivas
let controls;
let animatedObjects = [];
let isAnimating = true;

// =============================================
// INICIALIZACIÓN
// =============================================

function init() {
    // Crear escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

    // Configurar renderer
    const container = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Crear cámaras con diferentes perspectivas
    setupCameras();

    // Configurar iluminación
    setupLights();

    // Crear geometrías con texturas
    createGeometries();

    // Configurar controles de órbita
    setupOrbitControls();

    // Event listeners para UI
    setupEventListeners();

    // Manejar resize
    window.addEventListener('resize', onWindowResize);

    // Ocultar loading screen
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 500);

    // Iniciar animación
    animate();
}

// =============================================
// CONFIGURACIÓN DE CÁMARAS
// =============================================

function setupCameras() {
    const aspect = window.innerWidth / window.innerHeight;

    // Cámara 1: Vista general (perspectiva)
    camera1 = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera1.position.set(8, 6, 8);
    camera1.lookAt(0, 0, 0);

    // Cámara 2: Vista superior
    camera2 = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera2.position.set(0, 15, 0);
    camera2.lookAt(0, 0, 0);

    // Cámara 3: Vista lateral
    camera3 = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera3.position.set(15, 3, 0);
    camera3.lookAt(0, 0, 0);

    // Establecer cámara inicial
    currentCamera = camera1;
}

// =============================================
// ILUMINACIÓN
// =============================================

function setupLights() {
    // Luz ambiental suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Luz direccional principal con sombras
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Luz puntual de color para efecto dramático
    const pointLight = new THREE.PointLight(0x667eea, 1, 20);
    pointLight.position.set(-5, 5, -5);
    scene.add(pointLight);

    // Helper para visualizar la luz (opcional)
    // const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.5);
    // scene.add(pointLightHelper);
}

// =============================================
// CREACIÓN DE GEOMETRÍAS Y TEXTURAS
// =============================================

function createGeometries() {
    // Cargar texturas desde archivos
    const textureLoader = new THREE.TextureLoader();
    
    // Cargar las texturas personalizadas
    const floorTexture = textureLoader.load('./textures/rock_embedded_floor_disp_4k.png');
    const wallTexture = textureLoader.load('./textures/stacked_stone_wall_diff_4k.jpg');
    const woodTexture = textureLoader.load('./textures/wood_table_diff_4k.jpg');
    
    // Configurar repetición para el piso
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(3, 3);
    
    // Configurar repetición para la pared/cubo
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(1, 1);
    
    // Configurar textura de madera
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;

    // ===== PISO CON TEXTURA DE ROCA =====
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.9,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);

    // ===== CUBO CENTRAL CON TEXTURA DE PIEDRA =====
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.8,
        metalness: 0.2
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 0, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
    animatedObjects.push({ mesh: cube, type: 'rotate' });

    // ===== ESFERA CON TEXTURA DE MADERA =====
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.7,
        metalness: 0.3
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(3, 1, 3);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);
    animatedObjects.push({ mesh: sphere, type: 'bounce' });

    // ===== TOROIDE ROTATORIO =====
    const torusGeometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
    const torusMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        roughness: 0.4,
        metalness: 0.6
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.set(-3, 1, -3);
    torus.castShadow = true;
    torus.receiveShadow = true;
    scene.add(torus);
    animatedObjects.push({ mesh: torus, type: 'spin' });

    // ===== CILINDRO =====
    const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
    const cylinderMaterial = new THREE.MeshStandardMaterial({
        color: 0x4ecdc4,
        roughness: 0.5,
        metalness: 0.5
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(3, 0.5, -3);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    scene.add(cylinder);
    animatedObjects.push({ mesh: cylinder, type: 'oscillate' });

    // ===== CONO =====
    const coneGeometry = new THREE.ConeGeometry(0.8, 2, 32);
    const coneMaterial = new THREE.MeshStandardMaterial({
        color: 0xffe66d,
        roughness: 0.6,
        metalness: 0.4
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(-3, 1, 3);
    cone.castShadow = true;
    cone.receiveShadow = true;
    scene.add(cone);
    animatedObjects.push({ mesh: cone, type: 'scale' });

    // ===== DODECAEDRO =====
    const dodecahedronGeometry = new THREE.DodecahedronGeometry(0.8);
    const dodecahedronMaterial = new THREE.MeshStandardMaterial({
        color: 0xa8e6cf,
        roughness: 0.3,
        metalness: 0.8,
        wireframe: false
    });
    const dodecahedron = new THREE.Mesh(dodecahedronGeometry, dodecahedronMaterial);
    dodecahedron.position.set(0, 3, 0);
    dodecahedron.castShadow = true;
    dodecahedron.receiveShadow = true;
    scene.add(dodecahedron);
    animatedObjects.push({ mesh: dodecahedron, type: 'orbit' });

    // ===== ICOSAEDRO =====
    const icosahedronGeometry = new THREE.IcosahedronGeometry(0.6);
    const icosahedronMaterial = new THREE.MeshStandardMaterial({
        color: 0xdda15e,
        roughness: 0.4,
        metalness: 0.6
    });
    const icosahedron = new THREE.Mesh(icosahedronGeometry, icosahedronMaterial);
    icosahedron.position.set(-4, 2, 0);
    icosahedron.castShadow = true;
    icosahedron.receiveShadow = true;
    scene.add(icosahedron);
    animatedObjects.push({ mesh: icosahedron, type: 'rotate' });
}

// =============================================
// FUNCIONES PARA CREAR TEXTURAS PROCEDURALES
// =============================================

function createCheckerboardTexture(color1, color2) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    const squareSize = size / 8;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            context.fillStyle = (i + j) % 2 === 0 ? '#' + color1.toString(16).padStart(6, '0') : '#' + color2.toString(16).padStart(6, '0');
            context.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

function createGridTexture(color1, color2) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    context.fillStyle = '#' + color1.toString(16).padStart(6, '0');
    context.fillRect(0, 0, size, size);

    context.strokeStyle = '#' + color2.toString(16).padStart(6, '0');
    context.lineWidth = 4;

    const gridSize = size / 8;
    for (let i = 0; i <= 8; i++) {
        context.beginPath();
        context.moveTo(i * gridSize, 0);
        context.lineTo(i * gridSize, size);
        context.stroke();

        context.beginPath();
        context.moveTo(0, i * gridSize);
        context.lineTo(size, i * gridSize);
        context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createDotsTexture(color1, color2) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    context.fillStyle = '#' + color1.toString(16).padStart(6, '0');
    context.fillRect(0, 0, size, size);

    context.fillStyle = '#' + color2.toString(16).padStart(6, '0');
    const dotSize = 20;
    const spacing = 60;

    for (let i = 0; i < size; i += spacing) {
        for (let j = 0; j < size; j += spacing) {
            context.beginPath();
            context.arc(i + spacing / 2, j + spacing / 2, dotSize, 0, Math.PI * 2);
            context.fill();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// =============================================
// ORBIT CONTROLS
// =============================================

function setupOrbitControls() {
    controls = new OrbitControls(currentCamera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2 + 0.2;
}

// =============================================
// EVENT LISTENERS
// =============================================

function setupEventListeners() {
    // Cambio de cámaras
    document.getElementById('camera1-btn').addEventListener('click', () => {
        switchCamera(camera1, 'General');
    });

    document.getElementById('camera2-btn').addEventListener('click', () => {
        switchCamera(camera2, 'Superior');
    });

    document.getElementById('camera3-btn').addEventListener('click', () => {
        switchCamera(camera3, 'Lateral');
    });

    // Toggle animación
    const toggleBtn = document.getElementById('toggle-animation');
    toggleBtn.addEventListener('click', () => {
        isAnimating = !isAnimating;
        toggleBtn.textContent = isAnimating ? 'Pausar Animaciones' : 'Reanudar Animaciones';
    });
}

// =============================================
// CAMBIO DE CÁMARA
// =============================================

function switchCamera(newCamera, name) {
    currentCamera = newCamera;
    controls.object = currentCamera;
    controls.update();
    
    document.getElementById('camera-indicator').textContent = `Cámara: ${name}`;
}

// =============================================
// ANIMACIONES
// =============================================

function animate() {
    requestAnimationFrame(animate);

    if (isAnimating) {
        const time = Date.now() * 0.001;

        animatedObjects.forEach(obj => {
            switch (obj.type) {
                case 'rotate':
                    obj.mesh.rotation.x += 0.01;
                    obj.mesh.rotation.y += 0.01;
                    break;

                case 'bounce':
                    obj.mesh.position.y = 1 + Math.sin(time * 2) * 0.5;
                    break;

                case 'spin':
                    obj.mesh.rotation.x += 0.02;
                    obj.mesh.rotation.z += 0.01;
                    break;

                case 'oscillate':
                    obj.mesh.rotation.y += 0.02;
                    obj.mesh.position.y = 0.5 + Math.abs(Math.sin(time)) * 0.5;
                    break;

                case 'scale':
                    const scale = 1 + Math.sin(time * 1.5) * 0.2;
                    obj.mesh.scale.set(scale, scale, scale);
                    break;

                case 'orbit':
                    obj.mesh.position.x = Math.cos(time) * 2;
                    obj.mesh.position.z = Math.sin(time) * 2;
                    obj.mesh.rotation.y += 0.03;
                    break;
            }
        });
    }

    controls.update();
    renderer.render(scene, currentCamera);
}

// =============================================
// RESPONSIVE
// =============================================

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    camera1.aspect = aspect;
    camera1.updateProjectionMatrix();

    camera2.aspect = aspect;
    camera2.updateProjectionMatrix();

    camera3.aspect = aspect;
    camera3.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// =============================================
// INICIAR APLICACIÓN
// =============================================

init();
