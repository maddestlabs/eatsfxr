# eatSFXR 🎛️🔊

> **Oh noes, it ate SFXR!**  
> **Ultra-lightweight ChipTone-inspired 3D Sound Effect Synthesizer PoC**  
> Built with C++20, Google Filament 3D PBR, LabSound WebAudio, and Lua 5.4 scripting.

`eatSFXR` is a focused proof-of-concept (PoC) for building a 3D procedural sound effect generator inspired by [ChipTone](https://sfbgames.itch.io/chiptone) (by SFB Games). 

Copied and evolved from the `drumpad` PoC, this project targets an ultra-minimal binary footprint for native desktop and WebAssembly deployment—avoiding the massive binary overhead of larger frameworks like Flutter, while delivering a deep, highly tweakable synth engine, Lua scripting core, and interactive 3D interface.

---

## 🎯 Project Goals & Motivation

* **ChipTone-like SFX Generation**: Procedural sound generation for retro 8-bit sound effects (jump, explosion, pickup, powerup, synth pads, hit, blip, laser).
* **Minimal Footprint**: Keep build sizes ultra-compact for WASM/Web and native execution without heavy framework bloat (e.g., Flutter binaries).
* **Lua Scripting Core**: Dynamic patch editing, sound modulation, preset generation, and macro controls driven by Lua 5.4.
* **Interactive 3D Interface**: PBR physical synth interface rendered via Google Filament with orthographic 3D projection.

---

## 🛠️ Tech Stack

* **3D Renderer**: **Google Filament (C++)** — Orthographic 3D Camera Projection (`filament::Camera::Projection::ORTHO`), PBR materials, custom shaders, dynamic lighting.
* **Audio Engine**: **LabSound (C++)** — Native C++ WebAudio graph (`AudioContext`, synth nodes, oscillators, envelopes, filters, gain, biquad filter nodes, custom noise/wave generators).
* **Scripting Core**: **Lua 5.4 + `sol2`** — Scriptable SFX parameters, randomization algorithms, patch presets, and Lua-driven sound triggering.
* **Dual-Mode Transpiler**: `src/LuaTranspiler.hpp` for optional AOT transpilation of Lua preset triggers into direct native C++ calls.
* **Build System**: `CMake 3.25+` + `Ninja` + `vcpkg` + Emscripten (`emcc`).

---

## 🏛️ Architecture & Text Engine Roadmap

Designed around LabCore's **Pluggable Dual-Pipeline Architecture** for 2D/3D UI text and rendering:

```
                  ┌────────────────────────┐
                  │   UTF-8 Text Stream    │
                  └───────────┬────────────┘
                              │
                  ┌───────────┴────────────┐
                  │      ITextShaper       │
                  └─────┬────────────┬─────┘
                        │            │
  Pipeline A (Light)    │            │    Pipeline B (Rich i18n)
 ┌──────────────────────┴┐          ┌┴─────────────────────────┐
 │ NanoVG / stb_truetype │          │   HarfBuzz + FreeType    │
 │ (~50 KB footprint)    │          │   (RTL, Arabic, Indic,   │
 │ Basic Latin, Kerning, │          │    Ligatures, Color Emoji│
 │ 1-bit LCD Bitmasks    │          │    OpenType Shaping)     │
 └──────────────────────┬┘          └┬─────────────────────────┘
                        │            │
                        └─────┬──────┘
                              ▼
                  ┌────────────────────────┐
                  │   IGlyphRasterizer     │
                  │   (GPU Texture Atlas)  │
                  └───────────┬────────────┘
                              ▼
                  ┌────────────────────────┐
                  │ Google Filament Quads  │
                  └────────────────────────┘
```

### Text Pipelines:
1. **Pipeline A (Lightweight Profile — Default)**:
   - `NanoVG` / `stb_truetype` + Canvas 2D API abstraction.
   - `~50 KB` binary overhead. Ideal for embedded synth LCD displays, web widgets, and memory-constrained builds.
2. **Pipeline B (Rich i18n Profile — Opt-in CMake Flag)**:
   - `HarfBuzz` + `FreeType` (+ SheenBidi) for full internationalization, RTL text, complex scripts, and color emoji.

---

## 📁 Repository Structure

```
c:\git\eatsfxr\
├── .github/workflows/deploy.yml# GitHub Actions workflow for WebAssembly build & GitHub Pages
├── CMakeLists.txt              # C++20 build script (Filament, LabSound, Lua 5.4, sol2)
├── vcpkg.json                  # vcpkg dependency manifest
├── README.md                   # Project documentation
├── build.ps1                   # WebAssembly compilation & local dev server launch script
├── scripts/                    # Lua synth patch & logic scripts
└── src/                        # Native C++ engine, audio nodes, & render loop
```

---

## 🌐 Building & Running (WebAssembly)

To compile to WebAssembly and start the dev server:

```powershell
.\build.ps1
```

This PowerShell script:
1. Configures Emscripten SDK toolchain (`emcc`, `emcmake`, `emmake`).
2. Builds `eatsfxr.wasm` / `eatsfxr.js`.
3. Launches a local web server on port `8080`.
4. Opens `http://localhost:8080/index.html` in your browser.
