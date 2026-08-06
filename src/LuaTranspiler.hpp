#ifndef LABCORE_LUA_TRANSPILER_HPP
#define LABCORE_LUA_TRANSPILER_HPP

#include <iostream>
#include <string>
#include <cmath>

namespace LabCore {

/**
 * LabCore Dual-Mode Lua-to-C++ Transpiler Specification
 * 
 * Demonstrates AOT (Ahead-Of-Time) transpilation of `drumpad_logic.lua`
 * into direct, zero-overhead C++ native machine code for production VST3/AU/CLAP export.
 */
class LuaTranspiler {
public:
    struct PadConfig {
        std::string name;
        float baseFreq;
        std::string synthType;
    };

    // Static C++ dispatch table compiled directly from Lua BankMaps AST
    static inline const PadConfig BANK_A[16] = {
        { "PAD 1 (808 SUB KICK)",   45.0f,  "sine_drop" },
        { "PAD 2 (PUNCH KICK)",     75.0f,  "punch_kick" },
        { "PAD 3 (MPC SNARE)",      220.0f, "snare_noise" },
        { "PAD 4 (808 CLAP)",       1200.0f,"clap_noise" },
        { "PAD 5 (RIMSHOT)",        850.0f, "rimshot" },
        { "PAD 6 (CLOSED HIHAT)",   6500.0f,"hat_closed" },
        { "PAD 7 (OPEN HIHAT)",     6500.0f,"hat_open" },
        { "PAD 8 (PEDAL HIHAT)",    5500.0f,"hat_closed" },
        { "PAD 9 (LOW TOM)",        110.0f, "tom" },
        { "PAD 10 (MID TOM)",       160.0f, "tom" },
        { "PAD 11 (HIGH TOM)",      240.0f, "tom" },
        { "PAD 12 (CRASH CYMBAL)",  4500.0f,"cymbal" },
        { "PAD 13 (RIDE CYMBAL)",   3800.0f,"ride" },
        { "PAD 14 (COWBELL)",       800.0f, "cowbell" },
        { "PAD 15 (SHAKER)",        7000.0f,"shaker" },
        { "PAD 16 (SYNTH STAB)",    440.0f, "synth_stab" }
    };

    /**
     * Transpiled zero-overhead native C++ pad trigger function.
     * Bypasses the Lua VM stack entirely during standalone native plugin builds.
     */
    static inline void transpiledOnPadTriggered(int padIndex, float velocity, float pitchSemitones,
                                               void(*audioCallback)(int, const std::string&, float, float),
                                               void(*gfxCallback)(int, float)) {
        if (padIndex < 1 || padIndex > 16) return;
        const auto& pad = BANK_A[padIndex - 1];

        // Direct C++ Math vs Lua runtime math.pow
        float pitchMult = std::pow(2.0f, pitchSemitones / 12.0f);
        float targetFreq = pad.baseFreq * pitchMult;

        // Direct C++ Function Invocations (No Sol2 stack marshalling)
        audioCallback(padIndex, pad.synthType, targetFreq, velocity);
        gfxCallback(padIndex, velocity);
    }
};

} // namespace LabCore

#endif // LABCORE_LUA_TRANSPILER_HPP
