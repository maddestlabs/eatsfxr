-- eatSFXR - 3D Synth Pad Logic & Generator Loader Script

require("scripts/sfxr_core")

-- Load modular preset generator scripts
require("scripts/generators/pickup")
require("scripts/generators/laser")
require("scripts/generators/explosion")
require("scripts/generators/powerup")
require("scripts/generators/hit")
require("scripts/generators/jump")
require("scripts/generators/blip")
require("scripts/generators/random")

EatSFXR = {
    activeSlot = 1,
    patches = {}
}

-- Initialize default 16 ChipTone presets for Pads 1..16
function EatSFXR.init()
    local categories = {
        [1]  = "pickup",     [2]  = "laser",      [3]  = "explosion", [4]  = "powerup",
        [5]  = "hit",        [6]  = "jump",       [7]  = "blip",      [8]  = "random",
        [9]  = "pickup",     [10] = "laser",      [11] = "explosion", [12] = "powerup",
        [13] = "hit",        [14] = "jump",       [15] = "blip",      [16] = "random"
    }

    for i = 1, 16 do
        EatSFXR.patches[i] = sfxr.preset(categories[i] or "random")
    end
end

-- Trigger pad slot (1..16)
function onPadTriggered(padIndex, velocity)
    padIndex = math.max(1, math.min(16, padIndex or 1))
    EatSFXR.activeSlot = padIndex

    local sound = EatSFXR.patches[padIndex] or sfxr.default_params()

    LabAudioHost.triggerSFXRSound(
        sound.wave_type or "square",
        sound.base_freq or 0.35,
        sound.freq_ramp or 0.0,
        sound.duty or 0.5,
        sound.env_attack or 0.0,
        sound.env_sustain or 0.1,
        sound.env_decay or 0.2,
        velocity or 1.0
    )

    LabGraphicsHost.animatePadEntity(padIndex, velocity or 1.0)
end

function getActivePatchCode()
    local sound = EatSFXR.patches[EatSFXR.activeSlot] or sfxr.default_params()
    return sfxr.to_code(sound)
end

EatSFXR.init()
