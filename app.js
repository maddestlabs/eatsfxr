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

// --- THREE.JS SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#386b66'); // ChipTone Teal Background

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 17.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = false;
controls.maxPolarAngle = Math.PI / 2 + 0.1;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.2);
keyLight.position.set(6, 12, 11);
keyLight.castShadow = true;
scene.add(keyLight);

// --- HELPER TO CREATE TEXT CANVAS TEXTURES ---
function create3DTextTexture(text, w = 256, h = 64, bgColor = null, textColor = '#111704', fontSize = 28) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
    }
    ctx.font = `bold ${fontSize}px "Share Tech Mono", "Outfit", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
}

// --- HELPER TO RENDER VECTOR WAVEFORM DIAGRAM TEXTURES ---
function createWaveformDiagramTexture(type, isSelected = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = isSelected ? '#d94336' : '#f2e880';
    ctx.fillRect(0, 0, 128, 96);
    ctx.strokeStyle = isSelected ? '#ffffff' : '#a83d09';
    ctx.lineWidth = 6;

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

// Preset Trigger Definitions - PROCEDURALLY RANDOMIZED ON EACH TAP
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

// --- DUAL LCD ENVELOPE GRAPH CANVAS TEXTURES ---
let freqCanvas, freqCtx, freqTexture;
let ampCanvas, ampCtx, ampTexture;

function initDisplayTextures() {
    freqCanvas = document.createElement('canvas');
    freqCanvas.width = 512; freqCanvas.height = 320;
    freqCtx = freqCanvas.getContext('2d');

    ampCanvas = document.createElement('canvas');
    ampCanvas.width = 512; ampCanvas.height = 320;
    ampCtx = ampCanvas.getContext('2d');

    updateDisplayTextures();

    freqTexture = new THREE.CanvasTexture(freqCanvas);
    freqTexture.needsUpdate = true;

    ampTexture = new THREE.CanvasTexture(ampCanvas);
    ampTexture.needsUpdate = true;
}

function updateDisplayTextures() {
    if (!freqCtx || !ampCtx) return;

    const p = STATE.params;

    // 1. Frequency Envelope Display Graph
    freqCtx.fillStyle = '#e5ebd9';
    freqCtx.fillRect(0, 0, 512, 320);

    freqCtx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    freqCtx.lineWidth = 2;
    for (let x = 0; x < 512; x += 32) {
        freqCtx.beginPath(); freqCtx.moveTo(x, 0); freqCtx.lineTo(x, 320); freqCtx.stroke();
    }

    const startY = 320 - (p.base_freq * 260 + 20);
    const endY = 320 - Math.max(10, Math.min(310, (p.base_freq + p.freq_ramp * 0.5) * 260 + 20));

    freqCtx.fillStyle = 'rgba(90, 115, 105, 0.45)';
    freqCtx.beginPath();
    freqCtx.moveTo(0, 320);
    freqCtx.lineTo(0, startY);
    freqCtx.quadraticCurveTo(256, (startY + endY) * 0.5 - p.freq_dramp * 80, 512, endY);
    freqCtx.lineTo(512, 320);
    freqCtx.closePath();
    freqCtx.fill();

    freqCtx.strokeStyle = '#223832';
    freqCtx.lineWidth = 5;
    freqCtx.stroke();

    // 2. Amplitude ADSR Envelope Display Graph
    ampCtx.fillStyle = '#e5ebd9';
    ampCtx.fillRect(0, 0, 512, 320);

    ampCtx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ampCtx.lineWidth = 2;
    for (let x = 0; x < 512; x += 32) {
        ampCtx.beginPath(); ampCtx.moveTo(x, 0); ampCtx.lineTo(x, 320); ampCtx.stroke();
    }

    const aX = p.env_attack * 400;
    const dX = aX + p.env_decay * 400;
    const sY = 320 - (p.env_sustain * 260 + 10);
    const rX = Math.min(480, dX + p.env_release * 400);

    ampCtx.fillStyle = 'rgba(90, 115, 105, 0.45)';
    ampCtx.beginPath();
    ampCtx.moveTo(0, 320);
    ampCtx.lineTo(aX, 20);
    ampCtx.lineTo(dX, sY);
    ampCtx.lineTo(rX, sY);
    ampCtx.lineTo(rX + 30, 320);
    ampCtx.closePath();
    ampCtx.fill();

    ampCtx.strokeStyle = '#223832';
    ampCtx.lineWidth = 5;
    ampCtx.stroke();

    if (freqTexture) freqTexture.needsUpdate = true;
    if (ampTexture) ampTexture.needsUpdate = true;
}

initDisplayTextures();

// --- 3D MATERIALS & MESH CHASSIS ---
const matTealChassis = new THREE.MeshStandardMaterial({ color: 0x3d7a74, roughness: 0.4, metalness: 0.2 });
const matDarkBezel   = new THREE.MeshStandardMaterial({ color: 0x224844, roughness: 0.3, metalness: 0.5 });
const matYellowBtn   = new THREE.MeshStandardMaterial({ color: 0xf2e880, roughness: 0.3, metalness: 0.1 });
const matKnobTeal    = new THREE.MeshStandardMaterial({ color: 0x7aa8a2, roughness: 0.3, metalness: 0.4 });

const matWhiteKey    = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.05 });
const matBlackKey    = new THREE.MeshStandardMaterial({ color: 0x181a1c, roughness: 0.3, metalness: 0.5 });

const matFreqDisplay = new THREE.MeshBasicMaterial({ map: freqTexture });
const matAmpDisplay  = new THREE.MeshBasicMaterial({ map: ampTexture });

const interactiveMeshes = [];
const pianoKeyMeshes = [];
const waveBtnMaterials = {};
const knobGroups = {};
const knobMeshes = {};

const synthGroup = new THREE.Group();
scene.add(synthGroup);

const CHASSIS_W = 15.6;
const CHASSIS_H = 9.8;
const CHASSIS_D = 0.6;

const mainBase = new THREE.Mesh(new THREE.BoxGeometry(CHASSIS_W, CHASSIS_H, CHASSIS_D), matTealChassis);
mainBase.receiveShadow = true;
synthGroup.add(mainBase);

// --- 1. LEFT GENERATOR RACK (Presets) ---
const genRackGroup = new THREE.Group();
genRackGroup.position.set(-CHASSIS_W * 0.38, 0, CHASSIS_D * 0.5);
synthGroup.add(genRackGroup);

// Header Label
const genHeaderTex = create3DTextTexture('GENERATOR', 256, 64, null, '#ffffff', 26);
const genHeaderMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.4), new THREE.MeshBasicMaterial({ map: genHeaderTex, transparent: true }));
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

RACK_PRESETS.forEach((p, idx) => {
    const py = 3.6 - idx * 0.95;
    const meshBtn = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.2), matYellowBtn);
    meshBtn.position.set(0, py, 0.1);
    meshBtn.userData = { type: 'presetBtn', preset: p.id, label: p.label };
    genRackGroup.add(meshBtn);
    interactiveMeshes.push(meshBtn);

    const btnTex = create3DTextTexture(p.label, 256, 64, null, '#223832', 26);
    const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.6), new THREE.MeshBasicMaterial({ map: btnTex, transparent: true }));
    textMesh.position.set(0, 0, 0.11);
    meshBtn.add(textMesh);
});

// --- 2. TOP WAVEFORM BUTTON RACK WITH VECTOR WAVEFORM DIAGRAMS ---
const waveRackGroup = new THREE.Group();
waveRackGroup.position.set(CHASSIS_W * 0.10, CHASSIS_H * 0.38, CHASSIS_D * 0.5);
synthGroup.add(waveRackGroup);

const waveHeaderTex = create3DTextTexture('WAVEFORM', 256, 64, null, '#ffffff', 26);
const waveHeaderMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.4), new THREE.MeshBasicMaterial({ map: waveHeaderTex, transparent: true }));
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

WAVE_LIST.forEach((w, idx) => {
    const px = (idx - 3) * 1.3;
    const waveMat = new THREE.MeshBasicMaterial({ map: createWaveformDiagramTexture(w.id, idx === 0) });
    const meshBtn = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 0.2), waveMat);
    meshBtn.position.set(px, 0, 0.1);
    meshBtn.userData = { type: 'waveBtn', wave: w.id, label: w.label };
    waveRackGroup.add(meshBtn);
    interactiveMeshes.push(meshBtn);
    waveBtnMaterials[w.id] = waveMat;
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

// --- 3. MIDDLE FREQUENCY & AMPLITUDE LCD DISPLAYS ---
const freqDisplayGroup = new THREE.Group();
freqDisplayGroup.position.set(-CHASSIS_W * 0.12, CHASSIS_H * 0.06, CHASSIS_D * 0.5);
synthGroup.add(freqDisplayGroup);

const meshFreqFrame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.2, 0.2), matDarkBezel);
freqDisplayGroup.add(meshFreqFrame);
const meshFreqFace = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.8), matFreqDisplay);
meshFreqFace.position.set(0, 0, 0.11);
freqDisplayGroup.add(meshFreqFace);

const freqHeaderTex = create3DTextTexture('FREQUENCY', 256, 64, null, '#ffffff', 24);
const freqHeaderMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.4), new THREE.MeshBasicMaterial({ map: freqHeaderTex, transparent: true }));
freqHeaderMesh.position.set(0, 1.8, 0.02);
freqDisplayGroup.add(freqHeaderMesh);

const ampDisplayGroup = new THREE.Group();
ampDisplayGroup.position.set(CHASSIS_W * 0.28, CHASSIS_H * 0.06, CHASSIS_D * 0.5);
synthGroup.add(ampDisplayGroup);

const meshAmpFrame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.2, 0.2), matDarkBezel);
ampDisplayGroup.add(meshAmpFrame);
const meshAmpFace = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.8), matAmpDisplay);
meshAmpFace.position.set(0, 0, 0.11);
ampDisplayGroup.add(meshAmpFace);

const ampHeaderTex = create3DTextTexture('AMPLITUDE', 256, 64, null, '#ffffff', 24);
const ampHeaderMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.4), new THREE.MeshBasicMaterial({ map: ampHeaderTex, transparent: true }));
ampHeaderMesh.position.set(0, 1.8, 0.02);
ampDisplayGroup.add(ampHeaderMesh);

// --- 4. 3D ROTARY KNOBS (STATIC TEXT LABELS ATTACHED TO SYNTH CHASSIS) ---
function create3DKnob(parent, x, y, id, label, minV, maxV, defaultVal) {
    const knobGroup = new THREE.Group();
    knobGroup.position.set(x, y, CHASSIS_D * 0.5);
    parent.add(knobGroup);

    const meshBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.4, 32), matKnobTeal);
    meshBody.rotation.x = Math.PI / 2;
    meshBody.userData = { type: 'knob3d', id: id, label: label, minVal: minV, maxVal: maxV };
    knobGroup.add(meshBody);
    interactiveMeshes.push(meshBody);

    const meshNotch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.42), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    meshNotch.position.set(0, 0.2, 0);
    meshBody.add(meshNotch);

    // Static Label text attached to PARENT chassis group (does NOT rotate with knob)
    const lblTex = create3DTextTexture(label, 256, 64, null, '#ffffff', 22);
    const lblMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshBasicMaterial({ map: lblTex, transparent: true }));
    lblMesh.position.set(x, y - 0.65, CHASSIS_D * 0.5 + 0.02);
    parent.add(lblMesh);

    knobGroups[id] = knobGroup;
    knobMeshes[id] = meshBody;
}

create3DKnob(synthGroup, -CHASSIS_W * 0.24, -CHASSIS_H * 0.18, 'base_freq', 'FREQ', 0.0, 1.0, 0.40);
create3DKnob(synthGroup, -CHASSIS_W * 0.16, -CHASSIS_H * 0.18, 'freq_ramp', 'SPEED', -1.0, 1.0, 0.20);
create3DKnob(synthGroup, -CHASSIS_W * 0.08, -CHASSIS_H * 0.18, 'freq_dramp', 'ACCEL', -1.0, 1.0, 0.00);
create3DKnob(synthGroup, 0.0, -CHASSIS_H * 0.18, 'arp_mod', 'BEND', -1.0, 1.0, 0.00);

create3DKnob(synthGroup, CHASSIS_W * 0.16, -CHASSIS_H * 0.18, 'env_attack', 'ATTACK', 0.0, 0.5, 0.02);
create3DKnob(synthGroup, CHASSIS_W * 0.24, -CHASSIS_H * 0.18, 'env_decay', 'DECAY', 0.01, 1.0, 0.15);
create3DKnob(synthGroup, CHASSIS_W * 0.32, -CHASSIS_H * 0.18, 'env_sustain', 'SUSTAIN', 0.0, 1.0, 0.60);
create3DKnob(synthGroup, CHASSIS_W * 0.40, -CHASSIS_H * 0.18, 'env_release', 'RELEASE', 0.01, 1.0, 0.25);

function syncKnobRotations() {
    for (const id in knobGroups) {
        const group = knobGroups[id];
        const mesh = knobMeshes[id];
        const fp = mesh.userData;
        const val = STATE.params[id] || 0;
        const norm = (val - fp.minVal) / (fp.maxVal - fp.minVal);
        group.rotation.z = -(norm - 0.5) * Math.PI * 1.5;
    }
    updateWaveformButtonsUI();
    updateDisplayTextures();
}

// --- 5. BOTTOM 3D VIRTUAL PIANO KEYBOARD ---
const pianoGroup = new THREE.Group();
pianoGroup.position.set(0, -CHASSIS_H * 0.38, CHASSIS_D * 0.5);
synthGroup.add(pianoGroup);

let whiteKeyCount = 0;
PIANO_KEYS.forEach((pk, idx) => {
    if (!pk.isBlack) {
        const px = (whiteKeyCount - 6.5) * 0.85;
        const meshKey = new THREE.Mesh(new THREE.BoxGeometry(0.80, 2.2, 0.25), matWhiteKey);
        meshKey.position.set(px, 0, 0.1);
        meshKey.userData = { type: 'pianoKey', note: pk.note, freq: pk.freq, index: idx };
        pianoGroup.add(meshKey);
        interactiveMeshes.push(meshKey);
        pianoKeyMeshes.push(meshKey);

        const keyLblTex = create3DTextTexture(pk.note, 128, 64, null, '#555555', 20);
        const keyLblMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ map: keyLblTex, transparent: true }));
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
        const meshKey = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.3, 0.35), matBlackKey);
        meshKey.position.set(px, 0.45, 0.2);
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

// Render Loop
function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

render();
