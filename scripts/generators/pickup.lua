-- eatSFXR Generator Script - Pickup / Coin
-- Generates retro 8-bit coin pickup arpeggios

sfxr.register_generator{
    id = "pickup",
    name = "Pickup / Coin",
    icon = "🪙",
    category = "items",
    description = "Retro coin pickup pitch arpeggios",
    generate = function()
        local p = sfxr.default_params()
        p.wave_type   = "square"
        p.base_freq   = sfxr.random_range(0.4, 0.7)
        p.env_attack  = 0.0
        p.env_sustain = 0.1
        p.env_decay   = sfxr.random_range(0.1, 0.25)
        p.env_punch   = 0.3
        p.arp_mod     = sfxr.random_range(0.3, 0.6)
        p.duty        = sfxr.random_range(0.3, 0.5)
        return p
    end
}
