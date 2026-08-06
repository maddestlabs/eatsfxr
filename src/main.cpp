#include <iostream>
#include <chrono>
#include <thread>
#include "LabSampler.hpp"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#endif

static LabCore::LabSampler* g_sampler = nullptr;

#ifdef __EMSCRIPTEN__
void emscripten_main_loop_step() {
    if (g_sampler) {
        g_sampler->update(0.016f); // 60 FPS update frame
    }
}

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void triggerPad(int padIndex, float velocity) {
        if (g_sampler) {
            g_sampler->triggerPad(padIndex, velocity);
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void setPitchSemitones(float semitones) {
        if (g_sampler) {
            g_sampler->setPitchSemitones(semitones);
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void setActiveBank(const char* bank) {
        if (g_sampler && bank) {
            g_sampler->setActiveBank(std::string(bank));
        }
    }
}
#endif

int main(int argc, char** argv) {
    std::cout << "=========================================================" << std::endl;
    std::cout << " LabCore Engine 🎛️⚡ — MPC2000XL 3D Drum Pad Sampler  " << std::endl;
    std::cout << " C++20 WebAssembly Target (Filament PBR + LabSound)      " << std::endl;
    std::cout << "=========================================================" << std::endl;

    g_sampler = new LabCore::LabSampler();

#ifndef __EMSCRIPTEN__
    // Create Desktop Filament Engine instance
    filament::Engine* engine = filament::Engine::create(filament::Engine::Backend::SHARED_GL);
    if (!engine) {
        std::cerr << "[Error] Failed to initialize Google Filament Engine!" << std::endl;
        return 1;
    }

    filament::Renderer* renderer = engine->createRenderer();
    filament::Scene* scene = engine->createScene();
    filament::View* view = engine->createView();

    view->setScene(scene);
    view->setViewport({ 0, 0, 1920, 1080 });

    g_sampler->initialize(engine, view, scene);

    std::cout << "\n[LabCore App Running] Triggering test pad hits..." << std::endl;
    g_sampler->triggerPad(1, 1.0f);  // 808 Sub Kick
    g_sampler->triggerPad(3, 0.85f); // MPC Snare
    g_sampler->triggerPad(6, 0.7f);  // Closed HiHat

    g_sampler->shutdown();
    engine->destroy(view);
    engine->destroy(scene);
    engine->destroy(renderer);
    filament::Engine::destroy(&engine);
    delete g_sampler;
    g_sampler = nullptr;

    std::cout << "[LabCore] Engine shut down cleanly." << std::endl;
#else
    std::cout << "[LabCore WASM] Initializing WebAssembly C++ Sampler Engine..." << std::endl;
    g_sampler->initialize(nullptr, nullptr, nullptr);

    // Enter WebAssembly Browser Animation Main Loop (60 FPS)
    emscripten_set_main_loop(emscripten_main_loop_step, 0, 1);
#endif

    return 0;
}
