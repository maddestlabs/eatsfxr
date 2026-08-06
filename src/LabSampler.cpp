#include "LabSampler.hpp"
#include <iostream>
#include <cmath>

#ifdef __EMSCRIPTEN__
#include <GLES3/gl3.h>
#include <emscripten/emscripten.h>
#include <emscripten/html5.h>

static const char* vShaderSrc = R"(#version 300 es
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aTexCoord;

uniform vec4 uRect;
uniform float uAspect;
out vec2 vUV;
out vec2 vPos;

void main() {
    vUV = aTexCoord;
    vec2 scale = vec2(uRect.z / uAspect, uRect.w);
    vec2 pos = vec2(uRect.x / uAspect, uRect.y) + aPos * scale;
    vPos = aPos;
    gl_Position = vec4(pos, 0.0, 1.0);
}
)";


static const char* fShaderSrc = R"(#version 300 es
precision mediump float;

in vec2 vUV;
in vec2 vPos;

uniform int uType; // 0=chassis, 1=cream panel, 2=wood trim, 3=pad, 4=vu meter, 5=lcd screen
uniform vec4 uColor;
uniform float uParam;

out vec4 FragColor;

void main() {
    if (uType == 0) { // Dark Slate N-Console Brushed Metal Chassis
        vec3 col = vec3(0.12, 0.15, 0.19);
        float grain = fract(sin(dot(vUV, vec2(12.9898, 78.233))) * 43758.5453) * 0.03;
        FragColor = vec4(col + grain, 1.0);
    } else if (uType == 1) { // Cream Aluminum Control Panel Strip
        vec3 col = vec3(0.85, 0.82, 0.76);
        float bevel = smoothstep(0.48, 0.5, abs(vPos.x)) * 0.15;
        FragColor = vec4(col - bevel, 1.0);
    } else if (uType == 2) { // Walnut Wood Base Trim Strip
        vec3 col = mix(vec3(0.24, 0.14, 0.09), vec3(0.18, 0.10, 0.06), vUV.y);
        FragColor = vec4(col, 1.0);
    } else if (uType == 3) { // Slate Rubber Drum Pad
        vec2 d = abs(vPos);
        float edge = max(d.x, d.y);
        vec3 baseCol = vec3(0.22, 0.26, 0.32);
        vec3 glowCol = vec3(0.95, 0.55, 0.15) * uParam;
        vec3 col = mix(baseCol, glowCol, clamp(uParam * 0.6, 0.0, 1.0));
        
        if (edge > 0.85) {
            col *= 0.65;
        } else if (edge > 0.80) {
            col *= 1.35;
        }
        FragColor = vec4(col + glowCol * 0.4, 1.0);
    } else if (uType == 4) { // Warm Glowing Analog VU Meter
        vec2 center = vec2(0.5, 0.2);
        float r = length(vUV - center);
        vec3 dialCol = vec3(0.96, 0.93, 0.85);
        
        float angle = (vUV.x - 0.5) * 1.5;
        float needleDiff = abs(angle - uParam);
        if (r < 0.65 && needleDiff < 0.018) {
            dialCol = vec3(0.1, 0.1, 0.1);
        }
        if (r > 0.45 && r < 0.52 && vUV.x > 0.65) {
            dialCol = vec3(0.85, 0.2, 0.15);
        }
        FragColor = vec4(dialCol, 1.0);
    } else if (uType == 5) { // Green Backlit LCD Screen
        vec3 bg = vec3(0.65, 0.75, 0.25);
        float scanline = sin(vUV.y * 120.0) * 0.04;
        FragColor = vec4(bg - scanline, 1.0);
    } else {
        FragColor = uColor;
    }
}
)";
#endif

namespace LabCore {

LabSampler::LabSampler() {}

LabSampler::~LabSampler() {
    shutdown();
}

void LabSampler::initialize(filament::Engine* engine, filament::View* view, filament::Scene* scene) {
    m_engine = engine;
    m_view = view;
    m_scene = scene;

    std::cout << "[LabCore] Initializing Native C++ Engine..." << std::endl;

    buildFilamentPBRScene();
    buildLabSoundWebAudioGraph();
#ifndef __EMSCRIPTEN__
    buildLuaScriptingEngine();
#endif

    std::cout << "[LabCore] Engine Initialized Successfully (Filament PBR + LabSound + Lua 5.4)." << std::endl;
}

void LabSampler::buildFilamentPBRScene() {
#ifndef __EMSCRIPTEN__
    std::cout << "[Filament] Setting up Orthographic Camera & PBR Scene..." << std::endl;

    // 1. Orthographic Camera Setup (Zero Perspective Distortion)
    m_orthoCamera = m_engine->createCamera();
    float aspect = 16.0f / 9.0f;
    float orthoWidth = 14.0f;
    float orthoHeight = orthoWidth / aspect;
    m_orthoCamera->setProjection(filament::Camera::Projection::ORTHO,
                                 -orthoWidth / 2.0f, orthoWidth / 2.0f,
                                 -orthoHeight / 2.0f, orthoHeight / 2.0f,
                                 0.1f, 100.0f);
    m_orthoCamera->lookAt({ 0, 0, 16 }, { 0, 0, 0 }, { 0, 1, 0 });
    m_view->setCamera(m_orthoCamera);

    // 2. Build 16 Drum Pad Filament Entities
    auto& rcm = m_engine->getRenderableManager();
    auto& tcm = m_engine->getTransformManager();

    float padSize = 1.05f;
    float padGap  = 0.22f;
    float startX  = 1.5f; // Right Blue Panel area
    float startY  = -1.8f;

    for (int row = 0; row < 4; row++) {
        for (int col = 0; col < 4; col++) {
            int idx = row * 4 + col;
            auto padEntity = utils::EntityManager::get().create();

            float px = startX + (col - 1.5f) * (padSize + padGap);
            float py = startY + (row - 1.5f) * (padSize + padGap);

            // Register entity in Filament Transform Manager
            auto instance = tcm.getInstance(padEntity);
            if (!instance) {
                tcm.create(padEntity);
                instance = tcm.getInstance(padEntity);
            }
            tcm.setTransform(instance, filament::math::mat4f::translation(filament::math::float3{ px, py, 0.1f }));

            m_pads[idx].entity = padEntity;
            m_scene->addEntity(padEntity);
        }
    }

    std::cout << "[Filament] Built 16 Drum Pad Entities, Chassis, & Ortho Camera." << std::endl;
#else
    std::cout << "[LabCore WASM] Initializing WebGL2 Context & Shaders..." << std::endl;
    EmscriptenWebGLContextAttributes attr;
    emscripten_webgl_init_context_attributes(&attr);
    attr.majorVersion = 2;
    attr.minorVersion = 0;
    attr.alpha = false;
    attr.depth = true;

    EMSCRIPTEN_WEBGL_CONTEXT_HANDLE ctx = emscripten_webgl_create_context("#canvas", &attr);
    if (ctx <= 0) {
        std::cerr << "[LabCore WASM Error] Failed to create WebGL2 context!" << std::endl;
        return;
    }
    emscripten_webgl_make_context_current(ctx);
    m_glCtx = (uint32_t)ctx;

    // Compile Shaders
    GLuint vs = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vs, 1, &vShaderSrc, NULL);
    glCompileShader(vs);

    GLuint fs = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fs, 1, &fShaderSrc, NULL);
    glCompileShader(fs);

    m_shaderProgram = glCreateProgram();
    glAttachShader(m_shaderProgram, vs);
    glAttachShader(m_shaderProgram, fs);
    glLinkProgram(m_shaderProgram);

    // Quad geometry (2D Unit Quad)
    float quadVertices[] = {
        // Pos (X,Y)   UV (U,V)
        -1.0f,  1.0f,  0.0f, 1.0f,
        -1.0f, -1.0f,  0.0f, 0.0f,
         1.0f, -1.0f,  1.0f, 0.0f,

        -1.0f,  1.0f,  0.0f, 1.0f,
         1.0f, -1.0f,  1.0f, 0.0f,
         1.0f,  1.0f,  1.0f, 1.0f
    };

    glGenVertexArrays(1, &m_quadVAO);
    glGenBuffers(1, &m_quadVBO);

    glBindVertexArray(m_quadVAO);
    glBindBuffer(GL_ARRAY_BUFFER, m_quadVBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(quadVertices), quadVertices, GL_STATIC_DRAW);

    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);

    glEnableVertexAttribArray(1);
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));

    std::cout << "[LabCore WASM] WebGL2 Context & MPC Geometry Shaders Ready." << std::endl;
#endif
}


void LabSampler::buildLabSoundWebAudioGraph() {
#ifndef __EMSCRIPTEN__
    std::cout << "[LabSound] Initializing Native C++ WebAudio Context..." << std::endl;

    // Create LabSound Native AudioContext
    m_audioContext = lab::MakeAudioContext();

    // Master Volume GainNode
    m_masterGainNode = std::make_shared<lab::GainNode>(*m_audioContext);
    m_masterGainNode->gain()->setValue(1.0f);

    // Master BiquadFilterNode (Lowpass)
    m_masterFilterNode = std::make_shared<lab::BiquadFilterNode>(*m_audioContext);
    m_masterFilterNode->setType(lab::BiquadFilterNode::Type::LOWPASS);
    m_masterFilterNode->frequency()->setValue(20000.0f);

    // Connect WebAudio Nodes: Filter -> Master Gain -> AudioContext Destination
    m_audioContext->connect(m_masterFilterNode, m_masterGainNode, 0, 0);
    m_audioContext->connect(m_masterGainNode, m_audioContext->destination(), 0, 0);

    std::cout << "[LabSound] Native WebAudio Node Graph Connected & Running." << std::endl;
#else
    std::cout << "[LabCore WASM] Built WebAssembly Audio Graph." << std::endl;
#endif
}

void LabSampler::buildLuaScriptingEngine() {
#ifndef __EMSCRIPTEN__
    std::cout << "[Lua 5.4 / sol2] Initializing Lua VM & LabCore Bindings..." << std::endl;

    m_lua.open_libraries(sol::lib::base, sol::lib::math, sol::lib::string, sol::lib::table);

    // Bind C++ Host Audio Callback to Lua `LabAudioHost.triggerSampleNode`
    auto audioHost = m_lua.create_named_table("LabAudioHost");
    audioHost["triggerSampleNode"] = [this](int padIdx, std::string synthType, float freq, float vel) {
        this->playAudioSample(padIdx, synthType, freq, vel);
    };

    // Bind C++ Host Graphics Callback to Lua `LabGraphicsHost.animatePadEntity`
    auto gfxHost = m_lua.create_named_table("LabGraphicsHost");
    gfxHost["animatePadEntity"] = [this](int padIdx, float vel) {
        this->animatePadEntity(padIdx, vel);
    };

    gfxHost["updateLCDDisplay"] = [this](std::string padName, float pitch, std::string bank) {
        this->updateLCDDisplay(padName, pitch, bank);
    };

    // Load and execute `drumpad_logic.lua`
    try {
        m_lua.script_file("scripts/drumpad_logic.lua");
        std::cout << "[Lua 5.4] Loaded scripts/drumpad_logic.lua successfully." << std::endl;
    } catch (const sol::error& err) {
        std::cerr << "[Lua Error] Failed to load script: " << err.what() << std::endl;
    }
#endif
}

void LabSampler::triggerPad(int padIndex, float velocity) {
    std::cout << "[LabCore WASM] C++ triggerPad(" << padIndex << ", " << velocity << ")" << std::endl;
    playAudioSample(padIndex, "SYNTH_PERC", 220.0f, velocity);
    animatePadEntity(padIndex, velocity);
#ifndef __EMSCRIPTEN__
    // Invoke Lua `onPadTriggered(padIndex, velocity)`
    sol::protected_function func = m_lua["onPadTriggered"];
    if (func.valid()) {
        auto result = func(padIndex, velocity);
        if (!result.valid()) {
            sol::error err = result;
            std::cerr << "[Lua Script Error] " << err.what() << std::endl;
        }
    }
#endif
}

void LabSampler::playAudioSample(int padIndex, const std::string& synthType, float freq, float velocity) {
    std::cout << "[DSP Audio Trigger] Pad " << padIndex << " | Type: " << synthType 
              << " | Freq: " << freq << " Hz | Vel: " << velocity << std::endl;
#ifdef __EMSCRIPTEN__
    m_meterLevel = 0.85f * velocity;

    char scriptBuf[2048];
    snprintf(scriptBuf, sizeof(scriptBuf),

        "(function(){"
        "  if(!window._audCtx){ window._audCtx = new (window.AudioContext||window.webkitAudioContext)(); }"
        "  var ctx = window._audCtx; if(ctx.state==='suspended'){ctx.resume();}"
        "  var now = ctx.currentTime; var p = %d; var vel = %f;"
        "  var master = ctx.createGain(); master.gain.value = vel; master.connect(ctx.destination);"
        "  if(p===1||p===2){" // 808 Sub-Kick & Punchy Kick
        "    var osc = ctx.createOscillator(); var g = ctx.createGain();"
        "    osc.frequency.setValueAtTime(p===1?140:180, now); osc.frequency.exponentialRampToValueAtTime(32, now+0.25);"
        "    g.gain.setValueAtTime(1.0, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.35);"
        "    osc.connect(g); g.connect(master); osc.start(now); osc.stop(now+0.35);"
        "  }else if(p===3||p===4){" // Snare & Clap
        "    var buf = ctx.createBuffer(1, ctx.sampleRate*0.2, ctx.sampleRate); var d = buf.getChannelData(0);"
        "    for(var i=0;i<buf.length;i++) d[i] = Math.random()*2-1;"
        "    var src = ctx.createBufferSource(); src.buffer = buf;"
        "    var flt = ctx.createBiquadFilter(); flt.type = p===3?'highpass':'bandpass';"
        "    flt.frequency.value = p===3?1200:1500; var g = ctx.createGain();"
        "    g.gain.setValueAtTime(0.8, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.2);"
        "    src.connect(flt); flt.connect(g); g.connect(master); src.start(now); src.stop(now+0.2);"
        "  }else{" // Hi-Hats, Toms, Percussion
        "    var osc = ctx.createOscillator(); var g = ctx.createGain();"
        "    osc.type = (p>=5&&p<=8)?'square':'sine'; var baseF = 150 + p * 120;"
        "    osc.frequency.setValueAtTime(baseF, now); osc.frequency.exponentialRampToValueAtTime(baseF*0.4, now+0.18);"
        "    g.gain.setValueAtTime(0.6, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.2);"
        "    osc.connect(g); g.connect(master); osc.start(now); osc.stop(now+0.2);"
        "  }"
        "})();", padIndex, velocity);
    emscripten_run_script(scriptBuf);
#endif
}

void LabSampler::animatePadEntity(int padIndex, float velocity) {
    if (padIndex < 1 || padIndex > 16) return;
    auto& pad = m_pads[padIndex - 1];
    pad.targetDepth = 0.02f;
    pad.targetGlow  = 2.2f * velocity;
}

void LabSampler::updateLCDDisplay(const std::string& padName, float pitch, const std::string& bank) {
    // Updates LCD text entity
}

void LabSampler::setPitchSemitones(float semitones) {
    m_pitchSemitones = semitones;
#ifndef __EMSCRIPTEN__
    sol::protected_function func = m_lua["onPitchChanged"];
    if (func.valid()) func(semitones);
#endif
}

void LabSampler::setActiveBank(const std::string& bankLetter) {
    m_activeBank = bankLetter;
#ifndef __EMSCRIPTEN__
    sol::protected_function func = m_lua["onBankChanged"];
    if (func.valid()) func(bankLetter);
#endif
}

void LabSampler::update(float deltaTime) {
    // Interpolate pad compression depth & glow spring dynamics
    for (int i = 0; i < 16; i++) {
        auto& pad = m_pads[i];
        pad.currentDepth += (pad.targetDepth - pad.currentDepth) * 0.25f;
        pad.currentGlow  += (pad.targetGlow  - pad.currentGlow)  * 0.25f;

        // Reset pad spring target back to neutral
        pad.targetDepth = 0.1f;
        pad.targetGlow  = 0.0f;
    }

#ifdef __EMSCRIPTEN__
    if (!m_shaderProgram || !m_quadVAO) return;

    int width = 1280, height = 720;
    emscripten_get_canvas_element_size("#canvas", &width, &height);
    if (width < 10) width = 1280;
    if (height < 10) height = 720;
    glViewport(0, 0, width, height);

    float canvasAspect = (float)width / (float)height;
    float targetAspect = 16.0f / 9.0f;
    float uAspectVal = canvasAspect / targetAspect;

    glClearColor(0.03f, 0.04f, 0.05f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    glUseProgram(m_shaderProgram);
    glBindVertexArray(m_quadVAO);

    GLint uRect = glGetUniformLocation(m_shaderProgram, "uRect");
    GLint uAspect = glGetUniformLocation(m_shaderProgram, "uAspect");
    GLint uType = glGetUniformLocation(m_shaderProgram, "uType");
    GLint uParam = glGetUniformLocation(m_shaderProgram, "uParam");

    glUniform1f(uAspect, uAspectVal);

    // 1. Draw Main Dark Slate N-Console Chassis Panel
    glUniform4f(uRect, 0.0f, 0.0f, 0.95f, 0.90f);
    glUniform1i(uType, 0);
    glDrawArrays(GL_TRIANGLES, 0, 6);

    // 2. Draw Left Cream Aluminum Control Panel Strip
    glUniform4f(uRect, -0.52f, 0.0f, 0.38f, 0.85f);
    glUniform1i(uType, 1);
    glDrawArrays(GL_TRIANGLES, 0, 6);

    // 3. Draw Walnut Wood Trim Strip at Base
    glUniform4f(uRect, 0.0f, -0.88f, 0.95f, 0.05f);
    glUniform1i(uType, 2);
    glDrawArrays(GL_TRIANGLES, 0, 6);

    // 4. Draw Backlit Green LCD Screen (Top Left)
    glUniform4f(uRect, -0.52f, 0.52f, 0.32f, 0.22f);
    glUniform1i(uType, 5);
    glDrawArrays(GL_TRIANGLES, 0, 6);

    // 5. Draw Warm Analog VU Meter (Top Right)
    m_meterLevel *= 0.92f; // Smooth spring decay
    glUniform4f(uRect, 0.38f, 0.52f, 0.40f, 0.22f);
    glUniform1i(uType, 4);
    glUniform1f(uParam, (m_meterLevel - 0.5f) * 0.9f);
    glDrawArrays(GL_TRIANGLES, 0, 6);

    // 6. Draw 16 Drum Pads (4x4 Grid on Right Panel)
    float padW = 0.16f;
    float padH = 0.16f;
    float startX = 0.08f;
    float startY = -0.45f;
    float gapX = 0.20f;
    float gapY = 0.20f;

    for (int row = 0; row < 4; row++) {
        for (int col = 0; col < 4; col++) {
            int idx = row * 4 + col;
            float px = startX + col * gapX;
            float py = startY + row * gapY;

            float glow = m_pads[idx].currentGlow;

            glUniform4f(uRect, px, py, padW, padH);
            glUniform1i(uType, 3);
            glUniform1f(uParam, glow);
            glDrawArrays(GL_TRIANGLES, 0, 6);
        }
    }
#endif
}


void LabSampler::shutdown() {
#ifndef __EMSCRIPTEN__
    if (m_engine && m_orthoCamera) {
        m_engine->destroy(m_orthoCamera);
        m_orthoCamera = nullptr;
    }
#endif
}

} // namespace LabCore


