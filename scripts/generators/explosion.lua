-- eatSFXR Generator Script - Explosion
-- Generates low frequency noise blasts and rumbles

sfxr.register_generator{
    id = "explosion",
    name = "Explosion",
    icon = "💥",
    category = "effects",
    description = "White/pink noise rumbles and blasts",
    generate = function()
        local p = sfxr.default_params()
        p.wave_type   = "noise"
        p.base_freq   = sfxr.random_range(0.15, 0.4)
        p.freq_ramp   = -sfxr.random_range(0.1, 0.4)
        p.env_attack  = 0.0
        p.env_sustain = sfxr.random_range(0.08, 0.15)
        p.env_decay   = sfxr.random_range(0.3, 0.6)
        p.env_punch   = sfxr.random_range(0.3, 0.6)
        p.lpf_freq    = sfxr.random_range(0.5, 0.8)
        return p
    end
}
