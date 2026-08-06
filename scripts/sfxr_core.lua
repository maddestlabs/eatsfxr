-- eatSFXR - Core Lua Sound Synthesis Engine & ChipTone Preset Generator
-- Provides sfxr sound parameter data structures, generator registry, and curve math.

sfxr = {}
sfxr.generators = {}

function sfxr.random_range(min_val, max_val)
    return min_val + math.random() * (max_val - min_val)
end

function sfxr.choose(tbl)
    if type(tbl) ~= "table" or #tbl == 0 then return nil end
    return tbl[math.random(1, #tbl)]
end

function sfxr.coin_flip()
    return math.random() > 0.5
end

function sfxr.default_params()
    return {
        wave_type   = "sine",     -- "sine", "sawtooth", "rev_saw", "square", "triangle", "noise", "pink_noise", "custom"
        base_freq   = 0.35,       -- 0.0 to 1.0 (freq knob)
        freq_ramp   = 0.0,        -- -1.0 to 1.0 (speed knob)
        freq_dramp  = 0.0,        -- -1.0 to 1.0 (accel knob)
        duty        = 0.5,        -- 0.01 to 0.99
        env_attack  = 0.02,       -- 0.0 to 0.5s (attack knob)
        env_decay   = 0.15,       -- 0.01 to 1.0s (decay knob)
        env_sustain = 0.5,        -- 0.0 to 1.0 (sustain knob)
        env_release = 0.2,        -- 0.01 to 1.0s (release knob)
        env_punch   = 0.2,
        vib_speed   = 0.0,
        vib_depth   = 0.0,
        arp_mod     = 0.0,        -- -1.0 to 1.0 (bend knob)
        lpf_freq    = 1.0,
        hpf_freq    = 0.0,
        volume      = 0.5
    }
end

function sfxr.sound(user_params)
    local p = sfxr.default_params()
    if type(user_params) == "table" then
        for k, v in pairs(user_params) do
            if p[k] ~= nil and type(v) == type(p[k]) then
                p[k] = v
            end
        end
    end
    return p
end

function sfxr.to_code(p)
    local lines = {}
    table.insert(lines, "-- eatSFXR Sound Patch Definition")
    table.insert(lines, "return sfxr.sound{")
    table.insert(lines, string.format('    wave_type   = "%s",', p.wave_type or "sine"))
    table.insert(lines, string.format('    base_freq   = %.3f,', p.base_freq or 0.35))
    table.insert(lines, string.format('    freq_ramp   = %.3f,', p.freq_ramp or 0.0))
    table.insert(lines, string.format('    freq_dramp  = %.3f,', p.freq_dramp or 0.0))
    table.insert(lines, string.format('    duty        = %.3f,', p.duty or 0.5))
    table.insert(lines, string.format('    env_attack  = %.3f,', p.env_attack or 0.02))
    table.insert(lines, string.format('    env_decay   = %.3f,', p.env_decay or 0.15))
    table.insert(lines, string.format('    env_sustain = %.3f,', p.env_sustain or 0.5))
    table.insert(lines, string.format('    env_release = %.3f,', p.env_release or 0.2))
    table.insert(lines, string.format('    arp_mod     = %.3f,', p.arp_mod or 0.0))
    table.insert(lines, string.format('    lpf_freq    = %.3f,', p.lpf_freq or 1.0))
    table.insert(lines, string.format('    hpf_freq    = %.3f,', p.hpf_freq or 0.0))
    table.insert(lines, string.format('    volume      = %.3f',  p.volume or 0.5))
    table.insert(lines, "}")
    return table.concat(lines, "\n")
end

function sfxr.register_generator(gen)
    if type(gen) ~= "table" or not gen.id or type(gen.generate) ~= "function" then
        error("Invalid generator registration table.")
    end
    sfxr.generators[gen.id] = gen
end

function sfxr.preset(gen_id)
    local gen = sfxr.generators[gen_id] or sfxr.generators["coin"] or sfxr.generators["zap"]
    if gen and type(gen.generate) == "function" then
        return gen.generate()
    end
    return sfxr.default_params()
end
