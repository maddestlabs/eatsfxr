#ifndef LAB_3D_UI_HPP
#define LAB_3D_UI_HPP

#include <string>
#include <vector>
#include <memory>
#include <functional>
#include <cmath>

namespace Lab3DUI {

struct Vector3D {
    float x = 0.0f;
    float y = 0.0f;
    float z = 0.0f;
};

struct Bounds3D {
    Vector3D min;
    Vector3D max;

    bool containsPoint(const Vector3D& p) const {
        return (p.x >= min.x && p.x <= max.x &&
                p.y >= min.y && p.y <= max.y &&
                p.z >= min.z && p.z <= max.z);
    }
};

struct Ray3D {
    Vector3D origin;
    Vector3D direction;
};

struct HitResult {
    bool hit = false;
    float distance = 0.0f;
    Vector3D point;
    uint32_t widgetId = 0;
};

enum class Widget3DType {
    Container,
    Button,
    Slider,
    Knob,
    DisplayPanel
};

class Widget3D {
public:
    uint32_t id = 0;
    Widget3DType type = Widget3DType::Container;
    Vector3D position;
    Vector3D scale = { 1.0f, 1.0f, 1.0f };
    Bounds3D bounds;
    bool visible = true;
    bool enabled = true;
    std::string label;
    std::string icon;

    float currentGlow = 0.0f;
    float targetGlow = 0.0f;

    virtual ~Widget3D() = default;
    virtual void updatePhysics(float deltaTime) = 0;
    virtual bool raycast(const Ray3D& ray, HitResult& hitOut) = 0;
    virtual void onPointerDown(const Vector3D& hitPoint) = 0;
    virtual void onPointerDrag(float deltaX, float deltaY) = 0;
    virtual void onPointerUp() = 0;
};

class Button3D : public Widget3D {
public:
    float defaultZ = 0.1f;
    float currentZ = 0.1f;
    float targetZ = 0.1f;
    float pressDepth = 0.08f;
    bool isPressed = false;
    std::function<void()> onClick;

    Button3D(const std::string& lbl, float x, float y, float z, float width, float height, std::function<void()> cb = nullptr);

    void updatePhysics(float deltaTime) override;
    bool raycast(const Ray3D& ray, HitResult& hitOut) override;
    void onPointerDown(const Vector3D& hitPoint) override;
    void onPointerDrag(float deltaX, float deltaY) override;
    void onPointerUp() override;
};

class Slider3D : public Widget3D {
public:
    float trackLength = 2.0f;
    float value = 0.5f;
    float minVal = 0.0f;
    float maxVal = 1.0f;
    float currentCapX = 0.0f;
    float targetCapX = 0.0f;
    bool isDragging = false;
    std::function<void(float)> onChange;

    Slider3D(const std::string& lbl, float x, float y, float z, float length, float minV, float maxV, float defaultVal, std::function<void(float)> cb = nullptr);

    void updatePhysics(float deltaTime) override;
    bool raycast(const Ray3D& ray, HitResult& hitOut) override;
    void onPointerDown(const Vector3D& hitPoint) override;
    void onPointerDrag(float deltaX, float deltaY) override;
    void onPointerUp() override;
};

class Knob3D : public Widget3D {
public:
    float value = 0.5f;
    float minVal = 0.0f;
    float maxVal = 1.0f;
    float currentAngle = 0.0f;
    float targetAngle = 0.0f;
    bool isDragging = false;
    std::function<void(float)> onChange;

    Knob3D(const std::string& lbl, float x, float y, float z, float minV, float maxV, float defaultVal, std::function<void(float)> cb = nullptr);

    void updatePhysics(float deltaTime) override;
    bool raycast(const Ray3D& ray, HitResult& hitOut) override;
    void onPointerDown(const Vector3D& hitPoint) override;
    void onPointerDrag(float deltaX, float deltaY) override;
    void onPointerUp() override;
};

class PianoKey3D : public Widget3D {
public:
    int noteNumber = 60; // MIDI note (60 = C4)
    bool isBlackKey = false;
    float defaultZ = 0.1f;
    float currentZ = 0.1f;
    float targetZ = 0.1f;
    bool isPressed = false;
    std::function<void(int)> onNoteTrigger;

    PianoKey3D(int note, bool isBlack, float x, float y, float z, float width, float length, std::function<void(int)> cb = nullptr);

    void updatePhysics(float deltaTime) override;
    bool raycast(const Ray3D& ray, HitResult& hitOut) override;
    void onPointerDown(const Vector3D& hitPoint) override;
    void onPointerDrag(float deltaX, float deltaY) override;
    void onPointerUp() override;
};

class Lab3DUIManager {
public:
    Lab3DUIManager();
    ~Lab3DUIManager();

    void update(float deltaTime);

    bool handlePointerDown(const Ray3D& ray);
    void handlePointerDrag(float deltaX, float deltaY);
    void handlePointerUp();

    void addWidget(std::shared_ptr<Widget3D> widget);
    const std::vector<std::shared_ptr<Widget3D>>& getWidgets() const { return m_widgets; }

private:
    std::vector<std::shared_ptr<Widget3D>> m_widgets;
    std::shared_ptr<Widget3D> m_activeWidget;
    static uint32_t s_nextId;
};

} // namespace Lab3DUI

#endif // LAB_3D_UI_HPP
