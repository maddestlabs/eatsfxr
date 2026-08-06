-- eatSFXR Generator Script - Powerup
-- Generates rising pitch chimes and vibrato powerups

sfxr.register_generator{
    id = "powerup",
    name = "Powerup",
    icon = "⭐",
    category = "items",
    description = "Rising frequency sweeps with pitch vibrato",
    generate = function()
        local p = sfxr.default_params()
        p.wave_type   = "square"
        p.base_freq   = sfxr.random_range(0.2, 0.4)
        p.freq_ramp   = sfxr.random_range(0.3, 0.6)
        p.env_attack  = 0.0
        p.env_sustain = sfxr.random_range(0.15, 0.3)
        p.env_decay   = sfxr.random_range(0.15, 0.3)
        p.vib_speed   = sfxr.random_range(0.3, 0.6)
        p.vib_depth   = sfxr.random_range(0.2, 0.5)
        return p
    end
}
