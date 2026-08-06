#ifndef LABCORE_SAMPLER_HPP
#define LABCORE_SAMPLER_HPP

#include <memory>
#include <string>
#include <vector>
#include <array>

#ifndef __EMSCRIPTEN__
// Filament 3D Engine Includes
#include <filament/Engine.h>
#include <filament/Scene.h>
#include <filament/View.h>
#include <filament/Camera.h>
#include <filament/Material.h>
#include <filament/MaterialInstance.h>
#include <filament/RenderableManager.h>
#include <filament/TransformManager.h>
#include <utils/Entity.h>

// LabSound Native WebAudio Engine Includes
#include <LabSound/LabSound.h>
#include <LabSound/core/AudioContext.h>
#include <LabSound/core/GainNode.h>
#include <LabSound/core/BiquadFilterNode.h>
#include <LabSound/core/ConvolverNode.h>
#include <LabSound/extended/SampledAudioNode.h>

// Lua 5.4 & Sol2 Includes
#include <sol/sol.hpp>
#else
namespace filament {
    class Engine; class View; class Scene; class Camera; class Material; class MaterialInstance;
}
namespace utils {
    struct Entity { uint32_t id = 0; };
}
namespace lab {
    class AudioContext; class GainNode; class BiquadFilterNode; class ConvolverNode;
}
#endif

namespace LabCore {

struct PadEntity {
    utils::Entity entity;
    filament::MaterialInstance* matInstance = nullptr;
    float currentDepth = 0.1f;
    float targetDepth = 0.1f;
    float currentGlow = 0.0f;
    float targetGlow = 0.0f;
};

class LabSampler {
public:
    LabSampler();
    ~LabSampler();

    void initialize(filament::Engine* engine, filament::View* view, filament::Scene* scene);
    void update(float deltaTime);
    void shutdown();

    // Trigger Pad (1..16) with Velocity (0.0 .. 1.0)
    void triggerPad(int padIndex, float velocity = 1.0f);
    void setPitchSemitones(float semitones);
    void setActiveBank(const std::string& bankLetter);

    // Audio DSP Triggering
    void playAudioSample(int padIndex, const std::string& synthType, float freq, float velocity);
    void animatePadEntity(int padIndex, float velocity);
    void updateLCDDisplay(const std::string& padName, float pitch, const std::string& bank);

private:
    void buildFilamentPBRScene();
    void buildLabSoundWebAudioGraph();
    void buildLuaScriptingEngine();

    // Filament Objects
    filament::Engine* m_engine = nullptr;
    filament::View* m_view = nullptr;
    filament::Scene* m_scene = nullptr;
    filament::Camera* m_orthoCamera = nullptr;

    // Filament Entities
    utils::Entity m_chassisBeigeEntity;
    utils::Entity m_chassisBlueEntity;
    utils::Entity m_lcdScreenEntity;
    utils::Entity m_jogWheelEntity;
    utils::Entity m_faderCapEntity;
    std::array<PadEntity, 16> m_pads;

    // Filament PBR Materials
    filament::Material* m_matPBR = nullptr;
    filament::MaterialInstance* m_matBeige = nullptr;
    filament::MaterialInstance* m_matBlue = nullptr;
    filament::MaterialInstance* m_matGlass = nullptr;
    filament::MaterialInstance* m_matRubber = nullptr;

    // LabSound WebAudio Graph Nodes
    std::shared_ptr<lab::AudioContext> m_audioContext;
    std::shared_ptr<lab::GainNode> m_masterGainNode;
    std::shared_ptr<lab::BiquadFilterNode> m_masterFilterNode;
    std::shared_ptr<lab::ConvolverNode> m_reverbConvolverNode;

#ifndef __EMSCRIPTEN__
    // Lua 5.4 Script State
    sol::state m_lua;
#else
    uint32_t m_glCtx = 0;
    uint32_t m_shaderProgram = 0;
    uint32_t m_quadVAO = 0;
    uint32_t m_quadVBO = 0;
    float m_meterLevel = 0.0f;
#endif

    // Parameters
    float m_pitchSemitones = 0.0f;
    std::string m_activeBank = "A";
};

} // namespace LabCore


#endif // LABCORE_SAMPLER_HPP
