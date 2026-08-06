-- LabCore Engine - MPC-2000XL Drum Pad Sampler Scripting Logic
-- Drives pad assignments, bank switching, pitch tuning, and WebAudio DSP parameters.

DrumPad = {
    activeBank = "A",
    pitchSemitones = 0.0,
    mainVolumeDb = 0.0,
    lastPadTriggered = "PAD 1 (KICK 808)"
}

-- 16 Drum Pad Sound Assignment Maps per Bank
BankMaps = {
    A = {
        [1]  = { name = "PAD 1 (808 SUB KICK)",   baseFreq = 45,  type = "sine_drop" },
        [2]  = { name = "PAD 2 (PUNCH KICK)",     baseFreq = 75,  type = "punch_kick" },
        [3]  = { name = "PAD 3 (MPC SNARE)",      baseFreq = 220, type = "snare_noise" },
        [4]  = { name = "PAD 4 (808 CLAP)",       baseFreq = 1200,type = "clap_noise" },
        [5]  = { name = "PAD 5 (RIMSHOT)",        baseFreq = 850, type = "rimshot" },
        [6]  = { name = "PAD 6 (CLOSED HIHAT)",   baseFreq = 6500,type = "hat_closed" },
        [7]  = { name = "PAD 7 (OPEN HIHAT)",     baseFreq = 6500,type = "hat_open" },
        [8]  = { name = "PAD 8 (PEDAL HIHAT)",    baseFreq = 5500,type = "hat_closed" },
        [9]  = { name = "PAD 9 (LOW TOM)",        baseFreq = 110, type = "tom" },
        [10] = { name = "PAD 10 (MID TOM)",       baseFreq = 160, type = "tom" },
        [11] = { name = "PAD 11 (HIGH TOM)",      baseFreq = 240, type = "tom" },
        [12] = { name = "PAD 12 (CRASH CYMBAL)",  baseFreq = 4500,type = "cymbal" },
        [13] = { name = "PAD 13 (RIDE CYMBAL)",   baseFreq = 3800,type = "ride" },
        [14] = { name = "PAD 14 (COWBELL)",       baseFreq = 800, type = "cowbell" },
        [15] = { name = "PAD 15 (SHAKER)",        baseFreq = 7000,type = "shaker" },
        [16] = { name = "PAD 16 (SYNTH STAB)",    baseFreq = 440, type = "synth_stab" }
    },
    B = {
        [1] = { name = "BANK B (ROCK KICK)", baseFreq = 55, type = "punch_kick" },
        [3] = { name = "BANK B (ROCK SNARE)", baseFreq = 250, type = "snare_noise" }
    }
}

-- Callback when user clicks or presses key for Pad index (1..16)
function onPadTriggered(padIndex, velocity)
    local bank = BankMaps[DrumPad.activeBank] or BankMaps["A"]
    local padInfo = bank[padIndex] or BankMaps["A"][padIndex]

    DrumPad.lastPadTriggered = padInfo.name

    -- Calculate Pitch Multiplier based on Pitch Tuning & Bank
    local pitchMult = math.pow(2.0, DrumPad.pitchSemitones / 12.0)
    local targetFreq = padInfo.baseFreq * pitchMult

    -- Invoke C++ LabSound WebAudio Node Engine via LabCore Host Bindings
    LabAudioHost.triggerSampleNode(padIndex, padInfo.type, targetFreq, velocity)

    -- Trigger 3D Filament Pad Entity Glow & Spring Compression Animation
    LabGraphicsHost.animatePadEntity(padIndex, velocity)

    -- Update LCD Screen Matrix Display Text
    LabGraphicsHost.updateLCDDisplay(padInfo.name, DrumPad.pitchSemitones, DrumPad.activeBank)
end

-- Callback when Data Jog Wheel or Pitch Slider moves
function onPitchChanged(newSemitones)
    DrumPad.pitchSemitones = newSemitones
    LabGraphicsHost.updateLCDDisplay(DrumPad.lastPadTriggered, DrumPad.pitchSemitones, DrumPad.activeBank)
end

-- Callback when Bank Select (A, B, C, D) is pressed
function onBankChanged(bankLetter)
    DrumPad.activeBank = bankLetter
    LabGraphicsHost.updateLCDDisplay(DrumPad.lastPadTriggered, DrumPad.pitchSemitones, DrumPad.activeBank)
end
