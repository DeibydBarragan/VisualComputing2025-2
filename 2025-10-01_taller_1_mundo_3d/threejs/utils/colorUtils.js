// ===== UTILIDADES PARA MODELOS DE COLOR =====

/**
 * Convierte RGB a HSV
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)  
 * @param {number} b - Blue (0-255)
 * @returns {Object} {h, s, v} donde h está en [0,360] y s,v en [0,100]
 */
export function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : (diff / max) * 100;
    const v = max * 100;
    
    if (diff !== 0) {
        switch (max) {
            case r:
                h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
                break;
            case g:
                h = ((b - r) / diff + 2) * 60;
                break;
            case b:
                h = ((r - g) / diff + 4) * 60;
                break;
        }
    }
    
    return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

/**
 * Convierte HSV a RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} v - Value (0-100)
 * @returns {Object} {r, g, b} donde cada componente está en [0,255]
 */
export function hsvToRgb(h, s, v) {
    s /= 100;
    v /= 100;
    
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
        r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
        r = c; g = 0; b = x;
    }
    
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

/**
 * Convierte RGB a CIELAB (aproximación)
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)  
 * @returns {Object} {l, a, b} componentes de CIELAB
 */
export function rgbToCieLab(r, g, b) {
    // Primero convertir a XYZ
    let [x, y, z] = rgbToXyz(r, g, b);
    
    // Iluminante D65
    const xn = 95.047;
    const yn = 100.000;
    const zn = 108.883;
    
    x = x / xn;
    y = y / yn;
    z = z / zn;
    
    const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
    
    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b_lab = 200 * (fy - fz);
    
    return { l: l, a: a, b: b_lab };
}

/**
 * Convierte RGB a XYZ
 */
function rgbToXyz(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    r *= 100;
    g *= 100;
    b *= 100;
    
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    
    return [x, y, z];
}

/**
 * Calcula la diferencia de color Delta E en espacio CIELAB
 * @param {Object} lab1 - Primer color {l, a, b}
 * @param {Object} lab2 - Segundo color {l, a, b}
 * @returns {number} Diferencia Delta E
 */
export function deltaE(lab1, lab2) {
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;
    
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * Genera una paleta de colores armónica
 * @param {Object} baseColor - Color base {r, g, b}
 * @param {string} harmony - Tipo de armonía: 'complementary', 'triadic', 'analogous', 'split-complementary'
 * @returns {Array} Array de colores Three.js
 */
export function generateColorHarmony(baseColor, harmony = 'complementary') {
    const hsv = rgbToHsv(baseColor.r, baseColor.g, baseColor.b);
    const colors = [new THREE.Color(baseColor.r / 255, baseColor.g / 255, baseColor.b / 255)];
    
    switch (harmony) {
        case 'complementary':
            const compHue = (hsv.h + 180) % 360;
            const compRgb = hsvToRgb(compHue, hsv.s, hsv.v);
            colors.push(new THREE.Color(compRgb.r / 255, compRgb.g / 255, compRgb.b / 255));
            break;
            
        case 'triadic':
            for (let i = 1; i <= 2; i++) {
                const triadHue = (hsv.h + (120 * i)) % 360;
                const triadRgb = hsvToRgb(triadHue, hsv.s, hsv.v);
                colors.push(new THREE.Color(triadRgb.r / 255, triadRgb.g / 255, triadRgb.b / 255));
            }
            break;
            
        case 'analogous':
            for (let i = 1; i <= 2; i++) {
                const analogHue1 = (hsv.h + (30 * i)) % 360;
                const analogHue2 = (hsv.h - (30 * i) + 360) % 360;
                
                const analogRgb1 = hsvToRgb(analogHue1, hsv.s, hsv.v);
                const analogRgb2 = hsvToRgb(analogHue2, hsv.s, hsv.v);
                
                colors.push(new THREE.Color(analogRgb1.r / 255, analogRgb1.g / 255, analogRgb1.b / 255));
                colors.push(new THREE.Color(analogRgb2.r / 255, analogRgb2.g / 255, analogRgb2.b / 255));
            }
            break;
            
        case 'split-complementary':
            const splitHue1 = (hsv.h + 150) % 360;
            const splitHue2 = (hsv.h + 210) % 360;
            
            const splitRgb1 = hsvToRgb(splitHue1, hsv.s, hsv.v);
            const splitRgb2 = hsvToRgb(splitHue2, hsv.s, hsv.v);
            
            colors.push(new THREE.Color(splitRgb1.r / 255, splitRgb1.g / 255, splitRgb1.b / 255));
            colors.push(new THREE.Color(splitRgb2.r / 255, splitRgb2.g / 255, splitRgb2.b / 255));
            break;
    }
    
    return colors;
}

/**
 * Genera variaciones de luminosidad de un color
 * @param {Object} baseColor - Color base {r, g, b}
 * @param {number} steps - Número de variaciones
 * @returns {Array} Array de colores con diferentes luminosidades
 */
export function generateLuminanceVariations(baseColor, steps = 5) {
    const colors = [];
    const hsv = rgbToHsv(baseColor.r, baseColor.g, baseColor.b);
    
    for (let i = 0; i < steps; i++) {
        const value = (hsv.v / steps) * (i + 1);
        const rgb = hsvToRgb(hsv.h, hsv.s, value);
        colors.push(new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255));
    }
    
    return colors;
}

/**
 * Paletas de color predefinidas basadas en teoría del color
 */
export const COLOR_PALETTES = {
    // Paleta natural
    natural: [
        new THREE.Color(0x8B4513), // Marrón tierra
        new THREE.Color(0x228B22), // Verde bosque  
        new THREE.Color(0x87CEEB), // Azul cielo
        new THREE.Color(0xF4A460), // Arena
        new THREE.Color(0x696969)  // Gris piedra
    ],
    
    // Paleta cálida
    warm: [
        new THREE.Color(0xFF6B6B), // Coral
        new THREE.Color(0xFFE66D), // Amarillo cálido
        new THREE.Color(0xFF8E53), // Naranja
        new THREE.Color(0xC44569), // Rosa cálido
        new THREE.Color(0xF8B500)  // Dorado
    ],
    
    // Paleta fría  
    cool: [
        new THREE.Color(0x4ECDC4), // Turquesa
        new THREE.Color(0x45B7D1), // Azul cielo
        new THREE.Color(0x96CEB4), // Verde menta
        new THREE.Color(0x85C1E9), // Azul claro
        new THREE.Color(0x76D7C4)  // Aguamarina
    ],
    
    // Paleta monocromática azul
    monochrome_blue: [
        new THREE.Color(0x0F3460), // Azul oscuro
        new THREE.Color(0x16537e), // Azul medio-oscuro
        new THREE.Color(0x1e7e9c), // Azul medio
        new THREE.Color(0x29a0b1), // Azul medio-claro
        new THREE.Color(0x3cbccf)  // Azul claro
    ],
    
    // Paleta vibrante
    vibrant: [
        new THREE.Color(0xFF3838), // Rojo vibrante
        new THREE.Color(0xFF9F1A), // Naranja vibrante
        new THREE.Color(0xFFD23F), // Amarillo vibrante
        new THREE.Color(0x32CD32), // Verde vibrante
        new THREE.Color(0x1E90FF)  // Azul vibrante
    ]
};

/**
 * Calcula el contraste perceptual entre dos colores
 * @param {THREE.Color} color1 - Primer color
 * @param {THREE.Color} color2 - Segundo color
 * @returns {number} Ratio de contraste
 */
export function calculateContrast(color1, color2) {
    const l1 = getRelativeLuminance(color1);
    const l2 = getRelativeLuminance(color2);
    
    const brighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (brighter + 0.05) / (darker + 0.05);
}

/**
 * Calcula la luminancia relativa de un color
 */
function getRelativeLuminance(color) {
    const r = color.r <= 0.03928 ? color.r / 12.92 : Math.pow((color.r + 0.055) / 1.055, 2.4);
    const g = color.g <= 0.03928 ? color.g / 12.92 : Math.pow((color.g + 0.055) / 1.055, 2.4);
    const b = color.b <= 0.03928 ? color.b / 12.92 : Math.pow((color.b + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Función helper para aplicar paleta a materiales
 * @param {Array} objects - Array de objetos 3D
 * @param {Array} palette - Paleta de colores
 */
export function applyPaletteToObjects(objects, palette) {
    objects.forEach((obj, index) => {
        if (obj.material && obj.material.color) {
            const colorIndex = index % palette.length;
            obj.material.color.copy(palette[colorIndex]);
        }
    });
}

console.log('Utilidades de color cargadas correctamente');