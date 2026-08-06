import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- ENGINE STATE & CHIPTONE PARAMETER MODEL ---
const DEFAULT_SFXR_PARAMS = {
    wave_type: "sine",      // "sine", "sawtooth", "rev_saw", "square", "triangle", "noise", "pink_noise"
    base_freq: 0.40,        // 0.0 to 1.0 (freq knob)
    freq_ramp: 0.20,        // -1.0 to 1.0 (speed knob)
    freq_dramp: 0.00,       // -1.0 to 1.0 (accel knob)
    arp_mod: 0.00,          // -1.0 to 1.0 (bend knob)
    duty: 0.50,             // 0.01 to 0.99
    env_attack: 0.02,       // 0.0 to 0.5s (attack knob)
    env_decay: 0.15,        // 0.01 to 1.0s (decay knob)
    env_sustain: 0.60,      // 0.0 to 1.0 (sustain knob)
    env_release: 0.25,      // 0.01 to 1.0s (release knob)
    env_punch: 0.20,
    vib_speed: 0.00,
    vib_depth: 0.00,
    lpf_freq: 1.00,
    hpf_freq: 0.00,
    volume: 0.50
};

const STATE = {
    viewMode: 'front',
    activeControl: null,
    pointerStart: { x: 0, y: 0 },
    valStart: 0,
    params: { ...DEFAULT_SFXR_PARAMS },
    lastPresetName: 'COIN'
};

// 2 Octaves MIDI Piano Key Frequencies (C3 to B4)
const PIANO_KEYS = [
    { note: 'C3',  freq: 130.81, isBlack: false },
    { note: 'C#3', freq: 138.59, isBlack: true },
    { note: 'D3',  freq: 146.83, isBlack: false },
    { note: 'D#3', freq: 155.56, isBlack: true },
    { note: 'E3',  freq: 164.81, isBlack: false },
    { note: 'F3',  freq: 174.61, isBlack: false },
    { note: 'F#3', freq: 185.00, isBlack: true },
    { note: 'G3',  freq: 196.00, isBlack: false },
    { note: 'G#3', freq: 207.65, isBlack: true },
    { note: 'A3',  freq: 220.00, isBlack: false },
    { note: 'A#3', freq: 233.08, isBlack: true },
    { note: 'B3',  freq: 246.94, isBlack: false },
    { note: 'C4',  freq: 261.63, isBlack: false },
    { note: 'C#4', freq: 277.18, isBlack: true },
    { note: 'D4',  freq: 293.66, isBlack: false },
    { note: 'D#4', freq: 311.13, isBlack: true },
    { note: 'E4',  freq: 329.63, isBlack: false },
    { note: 'F4',  freq: 349.23, isBlack: false },
    { note: 'F#4', freq: 369.99, isBlack: true },
    { note: 'G4',  freq: 392.00, isBlack: false },
    { note: 'G#4', freq: 415.30, isBlack: true },
    { note: 'A4',  freq: 440.00, isBlack: false },
    { note: 'A#4', freq: 466.16, isBlack: true },
    { note: 'B4',  freq: 493.88, isBlack: false }
];

const QWERTY_PIANO = {
    'a': 0, 'w': 1, 's': 2, 'e': 3, 'd': 4, 'f': 5, 't': 6, 'g': 7, 'y': 8, 'h': 9, 'u': 10, 'j': 11,
    'k': 12, 'o': 13, 'l': 14, 'p': 15, ';': 16
};

const container = document.getElementById('canvas-container');
const hudTooltip = document.getElementById('hud-tooltip');
const hudLabel = document.getElementById('hud-label');
const hudValue = document.getElementById('hud-value');

// --- THREE.JS SCENE SETUP & ULTRA-REALISTIC STUDIO LIGHTING ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0e12'); // Dark studio backdrop

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 17.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = false;
controls.maxPolarAngle = Math.PI / 2 + 0.1;

// N-Console Studio Directional Key Light + Soft 3D Spotlight Vignette + Cool Fill + Specular Point Accent
const ambientLight = new THREE.AmbientLight(0xdbe6f0, 0.65);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff6ea, 2.2);
keyLight.position.set(-6, 14, 12); // Overhead-left casting down-right shadows like N-Console
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 30;
keyLight.shadow.camera.left = -12;
keyLight.shadow.camera.right = 12;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
keyLight.shadow.bias = -0.0003;
keyLight.shadow.radius = 2.5;
scene.add(keyLight);

// Soft 3D Studio Spotlight creating a natural vignette falloff over the panel and highlighting raised 3D surfaces
const vignetteSpotLight = new THREE.SpotLight(0xfff5ea, 3.8);
vignetteSpotLight.position.set(0, 3, 14);
vignetteSpotLight.angle = Math.PI / 3.0;
vignetteSpotLight.penumbra = 0.88; // Smooth radial vignette edge
vignetteSpotLight.decay = 1.0;
vignetteSpotLight.castShadow = true;
vignetteSpotLight.shadow.mapSize.width = 2048;
vignetteSpotLight.shadow.mapSize.height = 2048;
vignetteSpotLight.shadow.bias = -0.0003;
scene.add(vignetteSpotLight);

const fillLight = new THREE.DirectionalLight(0x7a9bb8, 0.75);
fillLight.position.set(10, -6, 8);
scene.add(fillLight);

const specularPointLight = new THREE.PointLight(0xffeedd, 1.2, 25);
specularPointLight.position.set(0, 4, 8);
scene.add(specularPointLight);

// --- PROCEDURAL GEOMETRY & TEXTURE GENERATORS ---
// 0. Rounded Chamfered Box Geometry with Centered UV Alignment
function createRoundedBoxGeometry(w, h, d, r = 0.04, bevelSegments = 3) {
    const shape = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const extrudeSettings = {
        depth: Math.max(0.01, d - r * 2),
        bevelEnabled: true,
        bevelSegments: bevelSegments,
        steps: 1,
        bevelSize: r,
        bevelThickness: r
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();

    // Re-map UV coordinates based on actual geometry bounding box for perfect texture alignment
    geo.computeBoundingBox();
    const min = geo.boundingBox.min;
    const max = geo.boundingBox.max;
    const rangeX = max.x - min.x;
    const rangeY = max.y - min.y;
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
        const u = (pos.getX(i) - min.x) / rangeX;
        const v = (pos.getY(i) - min.y) / rangeY;
        uvs.setXY(i, u, v);
    }
    uvs.needsUpdate = true;
    return geo;
}

// 1. Deep Slate Blue-Teal Powder-Coat & Micro Dust Noise Texture
function generateGrungeNoiseTexture(baseHex = '#1c3640') {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base Deep Slate Blue-Teal Color Fill (10% Darker & Leaning Blue-Teal)
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    // Fine powder-coat micro noise grain
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const n = (Math.random() - 0.5) * 18;
        data[i]     = Math.max(0, Math.min(255, data[i] + n));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    // Sparser, Half-Size Micro Whitish Dust Speckles with Varied Alpha Intensities
    for (let i = 0; i < 320; i++) {
        const rx = Math.random() * 512;
        const ry = Math.random() * 512;
        const rw = Math.random() * 0.9 + 0.5; // Half size (0.5px to 1.4px)
        const alpha = Math.random() * 0.38 + 0.08; // Varied intensity
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(rx, ry, rw, rw);
    }

    // Subtle dark grunge wear spots
    for (let i = 0; i < 180; i++) {
        const rx = Math.random() * 512;
        const ry = Math.random() * 512;
        const rw = Math.random() * 1.8 + 0.8;
        const alpha = Math.random() * 0.22 + 0.06;
        ctx.fillStyle = `rgba(10, 16, 20, ${alpha})`;
        ctx.fillRect(rx, ry, rw, rw);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 3);
    return texture;
}

const powderCoatBumpMap = generateGrungeNoiseTexture('#1c3640');

// 2. Grungy Non-Linear Noise Texture Generator for Knob Caps
function generateAnodizedKnobGrungeTexture(baseHexColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseHexColor;
    ctx.fillRect(0, 0, 256, 256);

    // Fine per-pixel micro noise grain (non-linear, organic)
    const imgData = ctx.getImageData(0, 0, 256, 256);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const n = (Math.random() - 0.5) * 22;
        data[i]     = Math.max(0, Math.min(255, data[i] + n));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    // Whitish dust noise speckles
    ctx.fillStyle = 'rgba(245, 250, 255, 0.35)';
    for (let i = 0; i < 450; i++) {
        const rx = Math.random() * 256;
        const ry = Math.random() * 256;
        const rw = Math.random() * 1.8 + 0.8;
        ctx.fillRect(rx, ry, rw, rw);
    }

    // Dark grime wear spots
    ctx.fillStyle = 'rgba(10, 15, 20, 0.22)';
    for (let i = 0; i < 160; i++) {
        const rx = Math.random() * 256;
        const ry = Math.random() * 256;
        const rw = Math.random() * 2.2 + 1;
        ctx.fillRect(rx, ry, rw, rw);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

function generateRubberKnobNoiseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1c2024';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = 'rgba(220, 230, 240, 0.25)';
    for (let i = 0; i < 500; i++) {
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.8, 1.8);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

const rubberKnobNoiseMap = generateRubberKnobNoiseTexture();

// Soft Warm Amber/Beige Backlight Halo Texture for Push Buttons (Strong Radiant Glow)
function createSoftBacklightHaloTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 64, 4, 128, 64, 120);
    grad.addColorStop(0, 'rgba(255, 235, 150, 1.0)');  // Bright warm yellow center glow
    grad.addColorStop(0.35, 'rgba(255, 195, 80, 0.85)'); // Warm amber mid glow
    grad.addColorStop(0.70, 'rgba(220, 150, 40, 0.40)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

const buttonBacklightHaloTex = createSoftBacklightHaloTexture();

// 2. Silkscreen Text Canvas Helper with Letterpress Inset Shadow & PBR Material
function create3DTextTexture(text, w = 256, h = 64, textColor = '#e8ecf0', fontSize = 24, fontStyle = 'bold') {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.font = `${fontStyle} ${fontSize}px "Outfit", "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Letterpress subtle dark shadow underneath
    ctx.fillStyle = 'rgba(10, 15, 20, 0.75)';
    ctx.fillText(text, w / 2, h / 2 + 1.5);

    // Main silkscreen ink text
    ctx.fillStyle = textColor;
    ctx.fillText(text, w / 2, h / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
}

function createSilkscreenMesh(text, w, h, textColor = '#e2e8f0', fontSize = 24) {
    const tex = create3DTextTexture(text, w * 128, h * 128, textColor, fontSize);
    const mat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        roughness: 0.75,
        metalness: 0.1,
        depthWrite: false
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

// 3. Vector Waveform Diagram Textures with Vintage Print Styling
function createWaveformDiagramTexture(type, isSelected = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Background - Recessed Bevel Button Face
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 96);
    if (isSelected) {
        bgGrad.addColorStop(0, '#e5533d');
        bgGrad.addColorStop(1, '#a82c1a');
    } else {
        bgGrad.addColorStop(0, '#f0e6ab');
        bgGrad.addColorStop(1, '#cfc280');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 128, 96);

    ctx.strokeStyle = isSelected ? '#ffffff' : '#223328';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    const cy = 48;
    ctx.beginPath();

    if (type === 'sine') {
        for (let x = 8; x < 120; x += 2) {
            const y = cy + Math.sin((x - 8) * 0.06) * 32;
            if (x === 8) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
    } else if (type === 'sawtooth') {
        ctx.moveTo(8, 76); ctx.lineTo(60, 20); ctx.lineTo(60, 76); ctx.lineTo(112, 20);
    } else if (type === 'rev_saw') {
        ctx.moveTo(8, 20); ctx.lineTo(60, 76); ctx.lineTo(60, 20); ctx.lineTo(112, 76);
    } else if (type === 'square') {
        ctx.moveTo(8, 76); ctx.lineTo(8, 20); ctx.lineTo(60, 20); ctx.lineTo(60, 76); ctx.lineTo(112, 76);
    } else if (type === 'triangle') {
        ctx.moveTo(8, 76); ctx.lineTo(36, 20); ctx.lineTo(64, 76); ctx.lineTo(92, 20); ctx.lineTo(112, 76);
    } else if (type === 'noise') {
        for (let x = 8; x < 120; x += 12) {
            const y = cy + (Math.random() * 64 - 32);
            if (x === 8) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
    } else if (type === 'pink_noise') {
        ctx.moveTo(8, 60); ctx.lineTo(30, 25); ctx.lineTo(55, 75); ctx.lineTo(80, 20); ctx.lineTo(112, 65);
    }

    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
}

// --- WEBAUDIO SYNTHESIZER ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playNotePitch(overrideFreq = null) {
    initAudio();
    if (!audioCtx) return;

    const p = STATE.params;
    const now = audioCtx.currentTime;

    const startFreq = overrideFreq ? overrideFreq : (20 * Math.pow(2, p.base_freq * 8));
    const endFreq = Math.max(20, startFreq * Math.pow(2, p.freq_ramp * 2.5));

    const attack = Math.max(0.005, p.env_attack);
    const decay = Math.max(0.01, p.env_decay);
    const sustainVol = p.env_sustain;
    const release = Math.max(0.01, p.env_release);
    const totalDuration = attack + decay + release;

    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(1.0, now + attack);
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, sustainVol), now + attack + decay);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

    masterGain.connect(audioCtx.destination);

    if (p.wave_type === 'noise' || p.wave_type === 'pink_noise') {
        const bufferSize = audioCtx.sampleRate * totalDuration;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = audioCtx.createBufferSource();
        src.buffer = noiseBuffer;
        src.connect(masterGain);
        src.start(now);
        src.stop(now + totalDuration);
    } else {
        const osc = audioCtx.createOscillator();
        osc.type = (p.wave_type === 'square') ? 'square' :
                   (p.wave_type === 'sawtooth' || p.wave_type === 'rev_saw') ? 'sawtooth' :
                   (p.wave_type === 'triangle') ? 'triangle' : 'sine';

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + totalDuration);

        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + totalDuration);
    }
}

// Preset Trigger Definitions
function triggerChipTonePreset(name) {
    STATE.lastPresetName = name.toUpperCase();
    const p = { ...DEFAULT_SFXR_PARAMS };
    const rnd = (min, max) => min + Math.random() * (max - min);

    if (name === 'coin') {
        p.wave_type = 'sine';
        p.base_freq = rnd(0.35, 0.65);
        p.freq_ramp = rnd(0.2, 0.45);
        p.env_attack = 0.01;
        p.env_decay = rnd(0.08, 0.18);
        p.env_sustain = rnd(0.5, 0.8);
        p.arp_mod = rnd(0.2, 0.5);
    } else if (name === 'zap') {
        p.wave_type = Math.random() > 0.5 ? 'sawtooth' : 'square';
        p.base_freq = rnd(0.6, 0.9);
        p.freq_ramp = -rnd(0.35, 0.75);
        p.env_attack = 0.005;
        p.env_decay = rnd(0.08, 0.22);
    } else if (name === 'boom') {
        p.wave_type = 'noise';
        p.base_freq = rnd(0.15, 0.35);
        p.freq_ramp = -rnd(0.1, 0.4);
        p.env_attack = 0.01;
        p.env_decay = rnd(0.35, 0.60);
        p.env_sustain = rnd(0.1, 0.3);
    } else if (name === 'jump') {
        p.wave_type = 'square';
        p.base_freq = rnd(0.25, 0.45);
        p.freq_ramp = rnd(0.3, 0.6);
        p.env_attack = 0.01;
        p.env_decay = rnd(0.15, 0.28);
    } else if (name === '1up') {
        p.wave_type = 'sine';
        p.base_freq = rnd(0.25, 0.45);
        p.freq_ramp = rnd(0.35, 0.65);
        p.env_attack = 0.01;
        p.env_decay = rnd(0.25, 0.45);
        p.env_sustain = rnd(0.7, 0.9);
    } else if (name === 'lose') {
        p.wave_type = 'sawtooth';
        p.base_freq = rnd(0.35, 0.55);
        p.freq_ramp = -rnd(0.35, 0.55);
        p.env_attack = 0.02;
        p.env_decay = rnd(0.3, 0.5);
    } else if (name === 'hurt') {
        p.wave_type = Math.random() > 0.5 ? 'noise' : 'square';
        p.base_freq = rnd(0.2, 0.45);
        p.freq_ramp = -rnd(0.25, 0.55);
        p.env_attack = 0.01;
        p.env_decay = rnd(0.12, 0.25);
    } else if (name === 'blip') {
        p.wave_type = Math.random() > 0.5 ? 'triangle' : 'square';
        p.base_freq = rnd(0.45, 0.75);
        p.freq_ramp = rnd(-0.1, 0.1);
        p.env_attack = 0.005;
        p.env_decay = rnd(0.05, 0.12);
    }

    STATE.params = p;
    syncKnobRotations();
    playNotePitch();
}

// --- VINTAGE AGED PARCHMENT METERS (ADSR & FREQUENCY DISPLAYS) ---
let freqCanvas, freqCtx, freqTexture;
let ampCanvas, ampCtx, ampTexture;

function renderVintageParchmentFace(ctx, titleStr) {
    const w = 512, h = 320;
    // Radial Gradient (N-Console vintage warm cream #f7f2e1 -> #e2d4b2 + top soft yellow lamp light #fef0c7)
    const bgGrad = ctx.createRadialGradient(256, 40, 20, 256, 160, 340);
    bgGrad.addColorStop(0, '#fef5d8'); // Warm top lamp glow
    bgGrad.addColorStop(0.45, '#f4ebd2');
    bgGrad.addColorStop(1, '#dfceaa');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle paper grain speckle overlay
    ctx.fillStyle = 'rgba(80, 65, 40, 0.035)';
    for (let i = 0; i < 600; i++) {
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        ctx.fillRect(rx, ry, 2, 2);
    }

    // Outer Vignette shadow rim inside glass
    const shadowGrad = ctx.createRadialGradient(256, 160, 180, 256, 160, 310);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
    shadowGrad.addColorStop(1, 'rgba(60,45,20,0.30)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, 0, w, h);

    // Grid Scale Lines
    ctx.strokeStyle = 'rgba(70, 60, 45, 0.16)';
    ctx.lineWidth = 2;
    for (let x = 32; x < w; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 32; y < h; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Vintage Watermark / Scale Header
    ctx.font = 'bold 16px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(60, 50, 35, 0.45)';
    ctx.textAlign = 'right';
    ctx.fillText(titleStr, w - 20, 28);
}

function updateDisplayTextures() {
    if (!freqCtx || !ampCtx) return;

    const p = STATE.params;

    // 1. Frequency Envelope Display Graph
    renderVintageParchmentFace(freqCtx, 'FREQ MODULATION [Hz]');

    const startY = 320 - (p.base_freq * 240 + 30);
    const endY = 320 - Math.max(10, Math.min(310, (p.base_freq + p.freq_ramp * 0.5) * 240 + 30));

    freqCtx.fillStyle = 'rgba(40, 75, 65, 0.28)';
    freqCtx.beginPath();
    freqCtx.moveTo(0, 320);
    freqCtx.lineTo(0, startY);
    freqCtx.quadraticCurveTo(256, (startY + endY) * 0.5 - p.freq_dramp * 80, 512, endY);
    freqCtx.lineTo(512, 320);
    freqCtx.closePath();
    freqCtx.fill();

    // Half opacity stroke line
    freqCtx.strokeStyle = 'rgba(29, 51, 42, 0.50)';
    freqCtx.lineWidth = 5;
    freqCtx.stroke();

    // 2. Amplitude ADSR Envelope Display Graph
    renderVintageParchmentFace(ampCtx, 'AMPLITUDE ADSR [mS]');

    const aX = p.env_attack * 400;
    const dX = aX + p.env_decay * 400;
    const sY = 320 - (p.env_sustain * 240 + 20);
    const rX = Math.min(480, dX + p.env_release * 400);

    ampCtx.fillStyle = 'rgba(40, 75, 65, 0.28)';
    ampCtx.beginPath();
    ampCtx.moveTo(0, 320);
    ampCtx.lineTo(aX, 30);
    ampCtx.lineTo(dX, sY);
    ampCtx.lineTo(rX, sY);
    ampCtx.lineTo(rX + 30, 320);
    ampCtx.closePath();
    ampCtx.fill();

    // Half opacity stroke line
    ampCtx.strokeStyle = 'rgba(29, 51, 42, 0.50)';
    ampCtx.lineWidth = 5;
    ampCtx.stroke();

    if (freqTexture) freqTexture.needsUpdate = true;
    if (ampTexture) ampTexture.needsUpdate = true;
}

function initDisplayTextures() {
    freqCanvas = document.createElement('canvas');
    freqCanvas.width = 512; freqCanvas.height = 320;
    freqCtx = freqCanvas.getContext('2d');

    ampCanvas = document.createElement('canvas');
    ampCanvas.width = 512; ampCanvas.height = 320;
    ampCtx = ampCanvas.getContext('2d');

    updateDisplayTextures();

    freqTexture = new THREE.CanvasTexture(freqCanvas);
    freqTexture.colorSpace = THREE.SRGBColorSpace;
    freqTexture.anisotropy = 8;
    freqTexture.needsUpdate = true;

    ampTexture = new THREE.CanvasTexture(ampCanvas);
    ampTexture.colorSpace = THREE.SRGBColorSpace;
    ampTexture.anisotropy = 8;
    ampTexture.needsUpdate = true;
}

// Procedural Glass Glare Streak Texture
function createGlassGlareTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.20)');
    grad.addColorStop(0.30, 'rgba(255, 255, 255, 0.03)');
    grad.addColorStop(0.70, 'rgba(255, 255, 255, 0.00)');
    grad.addColorStop(0.88, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.18)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

initDisplayTextures();

// --- 3D MATERIALS & MESH CHASSIS ---
// Deep Slate Teal Powder-Coated & Wear Grunge Metal Chassis (N-Console Style)
const matTealChassis = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: powderCoatBumpMap,
    bumpMap: powderCoatBumpMap,
    bumpScale: 0.022,
    roughness: 0.65,
    metalness: 0.15,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35
});

// Beveled Dark Steel Display Bezels & Hardware Trims
const matDarkSteel = new THREE.MeshStandardMaterial({
    color: 0x22262a,
    roughness: 0.32,
    metalness: 0.85
});

const matInnerShadowBezel = new THREE.MeshBasicMaterial({
    color: 0x0a0c0e
});

// Non-metallic transparent glass glare cover (subtle reflection streak overlay)
const matGlassCover = new THREE.MeshBasicMaterial({
    map: createGlassGlareTexture(),
    transparent: true,
    opacity: 0.25,
    depthWrite: false
});

const matYellowBtnFace = new THREE.MeshStandardMaterial({
    color: 0xedd891,
    roughness: 0.45,
    metalness: 0.15
});

const matWhiteKey = new THREE.MeshStandardMaterial({ color: 0xfdfdfd, roughness: 0.22, metalness: 0.05 });
const matBlackKey = new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.35, metalness: 0.60 });

const matFreqDisplayFace = new THREE.MeshBasicMaterial({ map: freqTexture });
const matAmpDisplayFace  = new THREE.MeshBasicMaterial({ map: ampTexture });

const interactiveMeshes = [];
const pianoKeyMeshes = [];
const waveBtnMaterials = {};
const waveBtnMeshes = {};
const presetBtnMeshes = {};
const knobGroups = {};
const knobMeshes = {};

const synthGroup = new THREE.Group();
scene.add(synthGroup);

const CHASSIS_W = 15.8;
const CHASSIS_H = 9.8;
const CHASSIS_D = 0.65;

// Base Chassis Slab
const mainBase = new THREE.Mesh(new THREE.BoxGeometry(CHASSIS_W, CHASSIS_H, CHASSIS_D), matTealChassis);
mainBase.receiveShadow = true;
mainBase.castShadow = true;
synthGroup.add(mainBase);

// Bottom Dark Walnut Wood Trim Strip (N-Console Bottom Bar)
const matWalnutWood = new THREE.MeshStandardMaterial({
    color: 0x3d2417,
    roughness: 0.65,
    metalness: 0.10
});
const bottomWoodBar = new THREE.Mesh(new THREE.BoxGeometry(CHASSIS_W, 0.40, CHASSIS_D + 0.06), matWalnutWood);
bottomWoodBar.position.set(0, -CHASSIS_H * 0.5 + 0.20, 0.03);
bottomWoodBar.castShadow = true;
synthGroup.add(bottomWoodBar);

// 4 Corner Hex / Torx Screws (gui1.1.png Style)
const matScrewChrome = new THREE.MeshStandardMaterial({ color: 0xb0b8c0, metalness: 0.95, roughness: 0.15 });
const screwGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16);

[[-7.3, 4.4], [7.3, 4.4], [-7.3, -4.4], [7.3, -4.4]].forEach(([sx, sy]) => {
    const screw = new THREE.Mesh(screwGeo, matScrewChrome);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(sx, sy, CHASSIS_D * 0.5 + 0.04);
    screw.castShadow = true;
    synthGroup.add(screw);

    // Inner hex socket indentation
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.09, 6), new THREE.MeshBasicMaterial({ color: 0x111417 }));
    socket.rotation.x = Math.PI / 2;
    socket.position.set(sx, sy, CHASSIS_D * 0.5 + 0.05);
    synthGroup.add(socket);
});

// --- 1. LEFT GENERATOR RACK (Presets with Recessed 3D Bevel Cutouts & Soft Beige Backlight) ---
const genRackGroup = new THREE.Group();
genRackGroup.position.set(-CHASSIS_W * 0.38, 0, CHASSIS_D * 0.5);
synthGroup.add(genRackGroup);

// Header Label
const genHeaderMesh = createSilkscreenMesh('GENERATOR', 2.2, 0.4, '#ffffff', 26);
genHeaderMesh.position.set(0, 4.3, 0.02);
genRackGroup.add(genHeaderMesh);

const RACK_PRESETS = [
    { id: 'coin', label: '⭐ COIN' },
    { id: 'zap',  label: '🔫 ZAP' },
    { id: 'boom', label: '💥 BOOM' },
    { id: 'jump', label: '🦘 JUMP' },
    { id: '1up',  label: '🍄 1UP' },
    { id: 'lose', label: '💀 LOSE' },
    { id: 'hurt', label: '😵 HURT' },
    { id: 'blip', label: '👉 BLIP' }
];

// Pre-create rounded button geometry for Generator push buttons
const roundedPresetBtnGeo = createRoundedBoxGeometry(2.18, 0.68, 0.22, 0.05, 3);

RACK_PRESETS.forEach((p, idx) => {
    const py = 3.6 - idx * 0.95;

    // Recessed 3D Stamped Chassis Bevel Cutout Frame
    const cutoutFrame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.82, 0.16), matDarkSteel);
    cutoutFrame.position.set(0, py, -0.02);
    genRackGroup.add(cutoutFrame);

    const innerShadow = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.74, 0.18), matInnerShadowBezel);
    innerShadow.position.set(0, py, -0.01);
    genRackGroup.add(innerShadow);

    // Tactile Hardware Push Button Cap with Rounded Chamfered Edges
    const meshBtn = new THREE.Mesh(roundedPresetBtnGeo, matYellowBtnFace);
    meshBtn.position.set(0, py, 0.10);
    meshBtn.castShadow = true;
    meshBtn.userData = { type: 'presetBtn', preset: p.id, label: p.label };
    genRackGroup.add(meshBtn);
    interactiveMeshes.push(meshBtn);
    presetBtnMeshes[p.id] = meshBtn;

    // Silkscreen text on button face
    const textMesh = createSilkscreenMesh(p.label, 2.0, 0.6, '#223832', 26);
    textMesh.position.set(0, 0, 0.12);
    meshBtn.add(textMesh);
});

// --- 2. TOP WAVEFORM BUTTON RACK WITH RECESSED BEVELS ---
const waveRackGroup = new THREE.Group();
waveRackGroup.position.set(CHASSIS_W * 0.10, CHASSIS_H * 0.38, CHASSIS_D * 0.5);
synthGroup.add(waveRackGroup);

const waveHeaderMesh = createSilkscreenMesh('WAVEFORM', 2.4, 0.4, '#ffffff', 26);
waveHeaderMesh.position.set(-4.5, 0, 0.02);
waveRackGroup.add(waveHeaderMesh);

const WAVE_LIST = [
    { id: 'sine', label: 'SINE' },
    { id: 'sawtooth', label: 'SAW' },
    { id: 'rev_saw', label: 'RSAW' },
    { id: 'square', label: 'SQR' },
    { id: 'triangle', label: 'TRI' },
    { id: 'noise', label: 'NOIS' },
    { id: 'pink_noise', label: 'PINK' }
];

const roundedWaveBtnGeo = createRoundedBoxGeometry(1.16, 0.84, 0.22, 0.05, 3);

WAVE_LIST.forEach((w, idx) => {
    const px = (idx - 3) * 1.3;

    // Recessed Bevel Frame
    const cutout = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.92, 0.16), matDarkSteel);
    cutout.position.set(px, 0, -0.02);
    waveRackGroup.add(cutout);

    const waveMat = new THREE.MeshBasicMaterial({ map: createWaveformDiagramTexture(w.id, idx === 0) });
    const meshBtn = new THREE.Mesh(roundedWaveBtnGeo, waveMat);
    meshBtn.position.set(px, 0, 0.10);
    meshBtn.castShadow = true;
    meshBtn.userData = { type: 'waveBtn', wave: w.id, label: w.label };
    waveRackGroup.add(meshBtn);
    interactiveMeshes.push(meshBtn);
    waveBtnMaterials[w.id] = waveMat;
    waveBtnMeshes[w.id] = meshBtn;
});

function updateWaveformButtonsUI() {
    WAVE_LIST.forEach(w => {
        const mat = waveBtnMaterials[w.id];
        if (mat) {
            mat.map = createWaveformDiagramTexture(w.id, STATE.params.wave_type === w.id);
            mat.map.needsUpdate = true;
        }
    });
}

// --- 3. MIDDLE VINTAGE METER DISPLAYS (BEVELED STEEL + GLASS COVER) ---
function createMeterDisplayGroup(x, titleText, displayMat) {
    const group = new THREE.Group();
    group.position.set(x, CHASSIS_H * 0.06, CHASSIS_D * 0.5);

    // Beveled Steel Outer Bezel
    const meshFrame = new THREE.Mesh(new THREE.BoxGeometry(4.9, 3.3, 0.20), matDarkSteel);
    meshFrame.castShadow = true;
    group.add(meshFrame);

    // Inner Dark Shadow Frame Rim (Backing plane)
    const meshShadowRim = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.0), matInnerShadowBezel);
    meshShadowRim.position.set(0, 0, 0.11);
    group.add(meshShadowRim);

    // Vintage Parchment Face
    const meshFace = new THREE.Mesh(new THREE.PlaneGeometry(4.45, 2.85), displayMat);
    meshFace.position.set(0, 0, 0.13);
    group.add(meshFace);

    // Glass Cover Plate with Specular Reflection
    const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.45, 2.85), matGlassCover);
    glassMesh.position.set(0, 0, 0.15);
    group.add(glassMesh);

    // Silkscreen Title Header
    const headerMesh = createSilkscreenMesh(titleText, 2.4, 0.4, '#ffffff', 24);
    headerMesh.position.set(0, 1.85, 0.02);
    group.add(headerMesh);

    return group;
}

const freqDisplayGroup = createMeterDisplayGroup(-CHASSIS_W * 0.12, 'FREQUENCY', matFreqDisplayFace);
synthGroup.add(freqDisplayGroup);

const ampDisplayGroup = createMeterDisplayGroup(CHASSIS_W * 0.28, 'AMPLITUDE', matAmpDisplayFace);
synthGroup.add(ampDisplayGroup);

// --- 4. MULTI-RING HARDWARE KNOBS (gui1.1.png & N-CONSOLE STYLE WITH GRUNGE CAPS) ---
// Colored anodized cap materials with grungy metallic wear textures
const knobCapMaterials = {
    freq: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: generateAnodizedKnobGrungeTexture('#3b5973'),
        bumpMap: generateAnodizedKnobGrungeTexture('#3b5973'),
        bumpScale: 0.008,
        roughness: 0.35,
        metalness: 0.70
    }),
    env: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: generateAnodizedKnobGrungeTexture('#9e3b33'),
        bumpMap: generateAnodizedKnobGrungeTexture('#9e3b33'),
        bumpScale: 0.008,
        roughness: 0.35,
        metalness: 0.70
    }),
    arp: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: generateAnodizedKnobGrungeTexture('#33855a'),
        bumpMap: generateAnodizedKnobGrungeTexture('#33855a'),
        bumpScale: 0.008,
        roughness: 0.35,
        metalness: 0.70
    }),
    gold: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: generateAnodizedKnobGrungeTexture('#a88532'),
        bumpMap: generateAnodizedKnobGrungeTexture('#a88532'),
        bumpScale: 0.008,
        roughness: 0.35,
        metalness: 0.70
    })
};

const matKnobRubberSkirt = new THREE.MeshStandardMaterial({
    color: 0x1a1d20,
    map: rubberKnobNoiseMap,
    bumpMap: rubberKnobNoiseMap,
    bumpScale: 0.010,
    roughness: 0.80,
    metalness: 0.20
});
const matSubKnobShadow = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false });

function create3DKnob(parent, x, y, id, label, minV, maxV, defaultVal, capCategory = 'freq') {
    const knobGroup = new THREE.Group();
    knobGroup.position.set(x, y, CHASSIS_D * 0.5);
    parent.add(knobGroup);

    // Sub-knob Contact Shadow Disk
    const shadowRing = new THREE.Mesh(new THREE.RingGeometry(0.01, 0.54, 32), matSubKnobShadow);
    shadowRing.rotation.x = Math.PI;
    shadowRing.position.set(0, 0, 0.01);
    knobGroup.add(shadowRing);

    // Rotatable Knob Assembly
    const knobBodyGroup = new THREE.Group();
    knobGroup.add(knobBodyGroup);

    // 1. Outer Knurled Rubber Skirt (24 Ridges)
    const skirtBody = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.26, 32), matKnobRubberSkirt);
    skirtBody.rotation.x = Math.PI / 2;
    skirtBody.castShadow = true;
    knobBodyGroup.add(skirtBody);

    // 24 ridges around circumference
    const ridgeGeo = new THREE.BoxGeometry(0.04, 0.24, 0.05);
    for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        const ridge = new THREE.Mesh(ridgeGeo, matKnobRubberSkirt);
        ridge.position.set(Math.cos(ang) * 0.45, Math.sin(ang) * 0.45, 0);
        ridge.rotation.z = ang;
        knobBodyGroup.add(ridge);
    }

    // 2. Inner Chamfered Metallic Cap
    const capMat = knobCapMaterials[capCategory] || knobCapMaterials.freq;
    const innerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.34, 32), capMat);
    innerCap.rotation.x = Math.PI / 2;
    innerCap.castShadow = true;
    knobBodyGroup.add(innerCap);

    // Interactivity Target Data
    skirtBody.userData = { type: 'knob3d', id: id, label: label, minVal: minV, maxVal: maxV };
    innerCap.userData = skirtBody.userData;
    interactiveMeshes.push(skirtBody);
    interactiveMeshes.push(innerCap);

    // 3. Debossed White Indicator Line Notch
    const meshNotch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.36), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    meshNotch.position.set(0, 0.22, 0);
    knobBodyGroup.add(meshNotch);

    // Static Label text attached to PARENT chassis group (does NOT rotate with knob)
    const lblMesh = createSilkscreenMesh(label, 0.9, 0.3, '#e8ecf0', 22);
    lblMesh.position.set(x, y - 0.65, CHASSIS_D * 0.5 + 0.02);
    parent.add(lblMesh);

    knobGroups[id] = knobBodyGroup;
    knobMeshes[id] = skirtBody;
}

create3DKnob(synthGroup, -CHASSIS_W * 0.24, -CHASSIS_H * 0.18, 'base_freq', 'FREQ', 0.0, 1.0, 0.40, 'freq');
create3DKnob(synthGroup, -CHASSIS_W * 0.16, -CHASSIS_H * 0.18, 'freq_ramp', 'SPEED', -1.0, 1.0, 0.20, 'freq');
create3DKnob(synthGroup, -CHASSIS_W * 0.08, -CHASSIS_H * 0.18, 'freq_dramp', 'ACCEL', -1.0, 1.0, 0.00, 'freq');
create3DKnob(synthGroup, 0.0, -CHASSIS_H * 0.18, 'arp_mod', 'BEND', -1.0, 1.0, 0.00, 'arp');

create3DKnob(synthGroup, CHASSIS_W * 0.16, -CHASSIS_H * 0.18, 'env_attack', 'ATTACK', 0.0, 0.5, 0.02, 'env');
create3DKnob(synthGroup, CHASSIS_W * 0.24, -CHASSIS_H * 0.18, 'env_decay', 'DECAY', 0.01, 1.0, 0.15, 'env');
create3DKnob(synthGroup, CHASSIS_W * 0.32, -CHASSIS_H * 0.18, 'env_sustain', 'SUSTAIN', 0.0, 1.0, 0.60, 'env');
create3DKnob(synthGroup, CHASSIS_W * 0.40, -CHASSIS_H * 0.18, 'env_release', 'RELEASE', 0.01, 1.0, 0.25, 'env');

function syncKnobRotations() {
    for (const id in knobGroups) {
        const bodyGroup = knobGroups[id];
        const mesh = knobMeshes[id];
        const fp = mesh.userData;
        const val = STATE.params[id] || 0;
        const norm = (val - fp.minVal) / (fp.maxVal - fp.minVal);
        bodyGroup.rotation.z = -(norm - 0.5) * Math.PI * 1.5;
    }
    updateWaveformButtonsUI();
    updateDisplayTextures();
}

// --- 5. BOTTOM 3D VIRTUAL PIANO KEYBOARD WITH TACTILE ROUNDED KEYS ---
const pianoGroup = new THREE.Group();
pianoGroup.position.set(0, -CHASSIS_H * 0.38, CHASSIS_D * 0.5);
synthGroup.add(pianoGroup);

const roundedWhiteKeyGeo = createRoundedBoxGeometry(0.80, 2.2, 0.25, 0.04, 3);
const roundedBlackKeyGeo = createRoundedBoxGeometry(0.48, 1.3, 0.35, 0.03, 3);

let whiteKeyCount = 0;
PIANO_KEYS.forEach((pk, idx) => {
    if (!pk.isBlack) {
        const px = (whiteKeyCount - 6.5) * 0.85;
        const meshKey = new THREE.Mesh(roundedWhiteKeyGeo, matWhiteKey);
        meshKey.position.set(px, 0, 0.1);
        meshKey.castShadow = true;
        meshKey.userData = { type: 'pianoKey', note: pk.note, freq: pk.freq, index: idx };
        pianoGroup.add(meshKey);
        interactiveMeshes.push(meshKey);
        pianoKeyMeshes.push(meshKey);

        const keyLblMesh = createSilkscreenMesh(pk.note, 0.5, 0.3, '#555555', 20);
        keyLblMesh.position.set(0, -0.7, 0.13);
        meshKey.add(keyLblMesh);

        whiteKeyCount++;
    }
});

// Black Keys
whiteKeyCount = 0;
PIANO_KEYS.forEach((pk, idx) => {
    if (!pk.isBlack) {
        whiteKeyCount++;
    } else {
        const px = (whiteKeyCount - 7.0) * 0.85 + 0.42;
        const meshKey = new THREE.Mesh(roundedBlackKeyGeo, matBlackKey);
        meshKey.position.set(px, 0.45, 0.2);
        meshKey.castShadow = true;
        meshKey.userData = { type: 'pianoKey', note: pk.note, freq: pk.freq, index: idx };
        pianoGroup.add(meshKey);
        interactiveMeshes.push(meshKey);
        pianoKeyMeshes.push(meshKey);
    }
});

// Raycasting Interaction (Resolves Parent Hierarchies Cleanly)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function triggerPianoKey(mesh) {
    const data = mesh.userData;
    mesh.position.z -= 0.08;
    playNotePitch(data.freq);
    showTooltip(window.innerWidth / 2, window.innerHeight - 80, `NOTE: ${data.note}`, `${data.freq.toFixed(1)} Hz`);

    setTimeout(() => {
        mesh.position.z += 0.08;
    }, 140);
}

window.addEventListener('pointerdown', (e) => {
    if (e.target !== renderer.domElement) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveMeshes, true);

    if (intersects.length > 0) {
        let mesh = intersects[0].object;
        while (mesh && (!mesh.userData || !mesh.userData.type) && mesh.parent) {
            mesh = mesh.parent;
        }

        if (mesh && mesh.userData && mesh.userData.type) {
            const data = mesh.userData;
            STATE.activeControl = mesh;
            STATE.pointerStart = { x: e.clientX, y: e.clientY };

            if (data.type === 'presetBtn') {
                triggerChipTonePreset(data.preset);
                showTooltip(e.clientX, e.clientY, data.label, `RANDOMIZED VARIATION`);
            } else if (data.type === 'waveBtn') {
                STATE.params.wave_type = data.wave;
                syncKnobRotations();
                playNotePitch();
                showTooltip(e.clientX, e.clientY, `WAVE: ${data.label}`, `WAVEFORM SELECT`);
            } else if (data.type === 'pianoKey') {
                triggerPianoKey(mesh);
            } else if (data.type === 'knob3d') {
                STATE.valStart = STATE.params[data.id];
            }
        }
    }
});

window.addEventListener('pointermove', (e) => {
    if (STATE.activeControl) {
        const mesh = STATE.activeControl;
        const data = mesh.userData;
        const deltaY = STATE.pointerStart.y - e.clientY;

        if (data.type === 'knob3d') {
            let norm = (STATE.valStart - data.minVal) / (data.maxVal - data.minVal);
            norm += deltaY * 0.005;
            norm = Math.max(0, Math.min(1, norm));

            const newVal = data.minVal + norm * (data.maxVal - data.minVal);
            STATE.params[data.id] = newVal;
            
            syncKnobRotations();
            showTooltip(e.clientX, e.clientY, data.label, `${newVal.toFixed(2)}`);
        }
    } else {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);
        container.style.cursor = intersects.length > 0 ? 'pointer' : (STATE.viewMode === '3d' ? 'grab' : 'default');
    }
});

window.addEventListener('pointerup', () => {
    STATE.activeControl = null;
    hudTooltip.classList.add('hidden');
});

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (QWERTY_PIANO[key] !== undefined) {
        const idx = QWERTY_PIANO[key];
        if (pianoKeyMeshes[idx]) triggerPianoKey(pianoKeyMeshes[idx]);
    }
});

function showTooltip(x, y, label, valStr) {
    hudLabel.textContent = label;
    hudValue.textContent = valStr;
    hudTooltip.style.left = `${x}px`;
    hudTooltip.style.top = `${y}px`;
    hudTooltip.classList.remove('hidden');
}

// Responsive Camera Auto-Framing for Desktop & Mobile Screens
function updateResponsiveCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    camera.aspect = aspect;
    renderer.setSize(width, height);

    if (aspect < 1.35) {
        camera.position.z = 17.5 * (1.35 / aspect);
    } else {
        camera.position.z = 17.5;
    }
    camera.updateProjectionMatrix();
}

window.addEventListener('resize', updateResponsiveCamera);
updateResponsiveCamera();

syncKnobRotations();

// Render Loop with Subtle Organic Studio Spotlight Swaying
function render(time) {
    requestAnimationFrame(render);

    if (vignetteSpotLight && time) {
        const t = time * 0.0007; // Very smooth, gentle motion
        vignetteSpotLight.position.x = Math.sin(t) * 1.5;
        vignetteSpotLight.position.y = 3.0 + Math.cos(t * 0.6) * 0.7;
    }

    renderer.render(scene, camera);
}

render();
