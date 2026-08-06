// WASM Bridge & Event Binding Layer for LabCore Sampler Tech Demo

document.addEventListener('DOMContentLoaded', () => {
    console.log('[LabCore WASM] Initializing Web Front-End Bridge...');

    // Keyboard trigger mapping
    const KEY_MAP = {
        '1': 0,  '2': 1,  '3': 2,  '4': 3,
        'z': 4,  'x': 5,  'c': 6,  'v': 7,
        'a': 8,  's': 9,  'd': 10, 'f': 11,
        'q': 12, 'w': 13, 'e': 14, 'r': 15
    };

    // Unlock WebAudio on initial click/keydown
    let audioUnlocked = false;
    function unlockAudio() {
        if (!audioUnlocked) {
            audioUnlocked = true;
            console.log('[LabCore WASM] Audio Context Unlocked by User Action.');
        }
    }

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', (e) => {
        unlockAudio();
        const key = e.key.toLowerCase();
        if (KEY_MAP.hasOwnProperty(key)) {
            const padIdx = KEY_MAP[key];
            triggerWasmPad(padIdx + 1, 1.0);
        }
    });

    // Helper to call WASM exported triggerPad function
    window.triggerWasmPad = function(padIndex, velocity) {
        if (typeof Module !== 'undefined' && Module._triggerPad) {
            Module._triggerPad(padIndex, velocity);
            console.log(`[LabCore WASM] Pad ${padIndex} triggered via WASM (Velocity: ${velocity})`);
        } else {
            console.warn('[LabCore WASM] Module._triggerPad not ready yet.');
        }
    };

    window.setWasmPitch = function(semitones) {
        if (typeof Module !== 'undefined' && Module._setPitchSemitones) {
            Module._setPitchSemitones(semitones);
        }
    };

    window.setWasmBank = function(bankLetter) {
        if (typeof Module !== 'undefined' && Module._setActiveBank && typeof allocateUTF8 === 'function') {
            const ptr = allocateUTF8(bankLetter);
            Module._setActiveBank(ptr);
            _free(ptr);
        }
    };
});
