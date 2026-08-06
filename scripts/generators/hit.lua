-- eatSFXR Generator Script - Hit / Hurt
-- Generates punchy impact hits and damage sounds

sfxr.register_generator{
    id = "hit",
    name = "Hit / Hurt",
    icon = "🥊",
    category = "combat",
    description = "Impact hits and damage sounds",
    generate = function()
        local p = sfxr.default_params()
        p.wave_type   = sfxr.choose({"square", "noise"})
        p.base_freq   = sfxr.random_range(0.2, 0.5)
        p.freq_ramp   = -sfxr.random_range(0.3, 0.6)
        p.env_attack  = 0.0
        p.env_sustain = sfxr.random_range(0.03, 0.08)
        p.env_decay   = sfxr.random_range(0.1, 0.25)
        p.env_punch   = sfxr.random_range(0.2, 0.5)
        return p
    end
}
