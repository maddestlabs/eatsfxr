-- eatSFXR Generator Script - Random
-- Generates completely wild random sound effects

sfxr.register_generator{
    id = "random",
    name = "Random",
    icon = "🎲",
    category = "general",
    description = "Wild randomized sound synthesis parameters",
    generate = function()
        local p = sfxr.default_params()
        p.wave_type   = sfxr.choose({"sine", "square", "sawtooth", "triangle", "noise"})
        p.base_freq   = math.random()
        p.freq_ramp   = (math.random() - 0.5) * 1.5
        p.duty        = math.random()
        p.env_attack  = math.random() * 0.2
        p.env_sustain = math.random() * 0.3
        p.env_punch   = math.random() * 0.5
        p.env_decay   = math.random() * 0.4
        if sfxr.coin_flip() then
            p.vib_speed = math.random()
            p.vib_depth = math.random()
        end
        if sfxr.coin_flip() then
            p.arp_mod = (math.random() - 0.5) * 1.5
        end
        return p
    end
}
