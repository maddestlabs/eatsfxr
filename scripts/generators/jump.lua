-- eatSFXR Generator Script - Jump
-- Generates platformer jump pitch sweeps

sfxr.register_generator{
    id = "jump",
    name = "Jump",
    icon = "🦘",
    category = "movement",
    description = "Platformer jump upward pitch sweeps",
    generate = function()
        local p = sfxr.default_params()
        p.wave_type   = "square"
        p.base_freq   = sfxr.random_range(0.3, 0.5)
        p.freq_ramp   = sfxr.random_range(0.25, 0.55)
        p.env_attack  = 0.0
        p.env_sustain = sfxr.random_range(0.08, 0.15)
        p.env_decay   = sfxr.random_range(0.15, 0.3)
        return p
    end
}
