// ===== UTILIDADES PARA CARGA DE MODELOS GLB =====

/**
 * Clase para manejar la carga de modelos GLB/GLTF
 */
export class GLBLoader {
    constructor() {
        this.loader = new THREE.GLTFLoader();
        this.loadedModels = {};
        this.loadingPromises = {};
    }

    /**
     * Carga un modelo GLB
     * @param {string} name - Nombre identificador del modelo
     * @param {string} path - Ruta al archivo GLB
     * @param {Object} options - Opciones de configuración
     * @returns {Promise} Promise que resuelve con el modelo cargado
     */
    async loadModel(name, path, options = {}) {
        const {
            scale = 1,
            position = { x: 0, y: 0, z: 0 },
            rotation = { x: 0, y: 0, z: 0 },
            castShadow = true,
            receiveShadow = true,
            animations = true
        } = options;

        // Si ya está cargando, devolver la promesa existente
        if (this.loadingPromises[name]) {
            return this.loadingPromises[name];
        }

        // Si ya está cargado, clonar y devolver
        if (this.loadedModels[name]) {
            return this.cloneModel(this.loadedModels[name], options);
        }

        // Crear nueva promesa de carga
        this.loadingPromises[name] = new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    console.log(`Modelo ${name} cargado exitosamente`);
                    
                    const model = gltf.scene;
                    
                    // Configurar escala
                    if (typeof scale === 'number') {
                        model.scale.setScalar(scale);
                    } else {
                        model.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
                    }
                    
                    // Configurar posición
                    model.position.set(position.x, position.y, position.z);
                    
                    // Configurar rotación
                    model.rotation.set(rotation.x, rotation.y, rotation.z);
                    
                    // Configurar sombras
                    this.setupShadows(model, castShadow, receiveShadow);
                    
                    // Configurar materiales PBR por defecto
                    this.setupDefaultMaterials(model);
                    
                    // Guardar animaciones si existen
                    if (animations && gltf.animations && gltf.animations.length > 0) {
                        model.userData.animations = gltf.animations;
                        model.userData.mixer = new THREE.AnimationMixer(model);
                        
                        // Reproducir primera animación por defecto
                        const action = model.userData.mixer.clipAction(gltf.animations[0]);
                        action.play();
                    }
                    
                    // Guardar referencia
                    this.loadedModels[name] = model;
                    
                    resolve(model);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100);
                    console.log(`Cargando ${name}: ${percent.toFixed(1)}%`);
                },
                (error) => {
                    console.error(`Error cargando modelo ${name}:`, error);
                    reject(error);
                }
            );
        });

        return this.loadingPromises[name];
    }

    /**
     * Clona un modelo ya cargado con nuevas opciones
     */
    cloneModel(originalModel, options = {}) {
        const cloned = originalModel.clone();
        
        const {
            scale = 1,
            position = { x: 0, y: 0, z: 0 },
            rotation = { x: 0, y: 0, z: 0 },
            castShadow = true,
            receiveShadow = true
        } = options;
        
        // Aplicar transformaciones
        if (typeof scale === 'number') {
            cloned.scale.setScalar(scale);
        } else {
            cloned.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
        }
        
        cloned.position.set(position.x, position.y, position.z);
        cloned.rotation.set(rotation.x, rotation.y, rotation.z);
        
        // Configurar sombras
        this.setupShadows(cloned, castShadow, receiveShadow);
        
        // Clonar animaciones si existen
        if (originalModel.userData.animations) {
            cloned.userData.animations = originalModel.userData.animations;
            cloned.userData.mixer = new THREE.AnimationMixer(cloned);
            
            const action = cloned.userData.mixer.clipAction(originalModel.userData.animations[0]);
            action.play();
        }
        
        return cloned;
    }

    /**
     * Configura sombras recursivamente en un modelo
     */
    setupShadows(object, castShadow, receiveShadow) {
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = castShadow;
                child.receiveShadow = receiveShadow;
            }
        });
    }

    /**
     * Configura materiales PBR por defecto
     */
    setupDefaultMaterials(object) {
        object.traverse((child) => {
            if (child.isMesh && child.material) {
                if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                    // Asegurar que el material tenga propiedades PBR básicas
                    if (child.material.roughness === undefined) {
                        child.material.roughness = 0.5;
                    }
                    if (child.material.metalness === undefined) {
                        child.material.metalness = 0.0;
                    }
                    
                    // Habilitar sRGB encoding para texturas de color
                    if (child.material.map) {
                        child.material.map.encoding = THREE.sRGBEncoding;
                    }
                }
            }
        });
    }

    /**
     * Actualiza animaciones de todos los modelos cargados
     */
    updateAnimations(deltaTime) {
        Object.values(this.loadedModels).forEach(model => {
            if (model.userData.mixer) {
                model.userData.mixer.update(deltaTime);
            }
        });
    }

    /**
     * Aplica un material a todas las mallas de un modelo
     */
    applyMaterialToModel(modelName, material) {
        const model = this.loadedModels[modelName];
        if (model) {
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = material;
                }
            });
        }
    }

    /**
     * Obtiene todas las mallas de un modelo para aplicar materiales individuales
     */
    getModelMeshes(modelName) {
        const model = this.loadedModels[modelName];
        const meshes = [];
        
        if (model) {
            model.traverse((child) => {
                if (child.isMesh) {
                    meshes.push(child);
                }
            });
        }
        
        return meshes;
    }

    /**
     * Carga múltiples modelos en paralelo
     */
    async loadMultipleModels(modelConfigs) {
        const promises = modelConfigs.map(config => 
            this.loadModel(config.name, config.path, config.options)
        );
        
        try {
            const models = await Promise.all(promises);
            console.log(`Todos los modelos (${models.length}) cargados exitosamente`);
            return models;
        } catch (error) {
            console.error('Error cargando algunos modelos:', error);
            throw error;
        }
    }

    /**
     * Obtiene información de un modelo cargado
     */
    getModelInfo(modelName) {
        const model = this.loadedModels[modelName];
        if (!model) return null;

        const info = {
            name: modelName,
            triangles: 0,
            vertices: 0,
            materials: [],
            animations: model.userData.animations ? model.userData.animations.length : 0,
            boundingBox: new THREE.Box3().setFromObject(model)
        };

        model.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry.index) {
                    info.triangles += child.geometry.index.count / 3;
                } else {
                    info.triangles += child.geometry.attributes.position.count / 3;
                }
                info.vertices += child.geometry.attributes.position.count;
                
                if (child.material && info.materials.indexOf(child.material.name) === -1) {
                    info.materials.push(child.material.name || 'Unnamed');
                }
            }
        });

        return info;
    }

    /**
     * Centra un modelo en el origen
     */
    centerModel(modelName) {
        const model = this.loadedModels[modelName];
        if (model) {
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
        }
    }

    /**
     * Ajusta automáticamente la escala de un modelo para que encaje en un tamaño específico
     */
    fitModelToSize(modelName, targetSize = 2) {
        const model = this.loadedModels[modelName];
        if (model) {
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);
            
            if (maxDimension > 0) {
                const scale = targetSize / maxDimension;
                model.scale.setScalar(scale);
            }
        }
    }

    /**
     * Limpia recursos de memoria
     */
    dispose() {
        Object.values(this.loadedModels).forEach(model => {
            model.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        
        this.loadedModels = {};
        this.loadingPromises = {};
    }
}

/**
 * Configuraciones de ejemplo para diferentes tipos de modelos
 */
export const MODEL_PRESETS = {
    organic: {
        scale: 1,
        roughness: 0.8,
        metalness: 0.0,
        color: 0x8B4513
    },
    architectural: {
        scale: 1,
        roughness: 0.3,
        metalness: 0.1,
        color: 0x888888
    },
    utilitarian: {
        scale: 1,
        roughness: 0.2,
        metalness: 0.7,
        color: 0x444444
    }
};

/**
 * Función helper para crear una instancia del loader global
 */
export function createGLBManager() {
    return new GLBLoader();
}

console.log('GLB Loader utilities cargadas correctamente');