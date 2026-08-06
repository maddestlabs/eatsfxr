-- eatSFXR Generator Script - Laser / Shoot
-- Generates energy zaps, lasers, and raygun sound effects

sfxr.register_generator{
    id = "laser",
    name = "Laser / Shoot",
    icon = "🔫",
    category = "weapons",
    description = "Downward pitch sweep zaps and lasers",
    generate = function()
        local p = sfxr.default_params()
        p.wave_type   = sfxr.choose({"square", "sawtooth"})
        p.base_freq   = sfxr.random_range(0.5, 0.9)
        p.freq_ramp   = -sfxr.random_range(0.25, 0.65)
        p.env_attack  = 0.0
        p.env_sustain = sfxr.random_range(0.02, 0.08)
        p.env_decay   = sfxr.random_range(0.1, 0.25)
        p.duty        = sfxr.random_range(0.1, 0.5)
        return p
    end
}
