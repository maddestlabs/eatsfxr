-- eatSFXR Generator Script - Blip / Select
-- Generates short UI blips and menu clicks

sfxr.register_generator{
    id = "blip",
    name = "Blip / Select",
    icon = "🔔",
    category = "ui",
    description = "Short UI blips, clicks, and menu selects",
    generate = function()
        local p = sfxr.default_params()
        p.wave_type   = sfxr.choose({"square", "triangle"})
        p.base_freq   = sfxr.random_range(0.4, 0.8)
        p.env_attack  = 0.0
        p.env_sustain = sfxr.random_range(0.02, 0.05)
        p.env_decay   = sfxr.random_range(0.05, 0.1)
        p.duty        = 0.5
        return p
    end
}
