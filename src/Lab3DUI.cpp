#include "Lab3DUI.hpp"
#include <algorithm>
#include <iostream>

namespace Lab3DUI {

uint32_t Lab3DUIManager::s_nextId = 1;

static bool rayIntersectsAABB(const Ray3D& ray, const Bounds3D& bounds, float& tOut) {
    float tMin = (bounds.min.x - ray.origin.x) / (std::abs(ray.direction.x) < 1e-6f ? 1e-6f : ray.direction.x);
    float tMax = (bounds.max.x - ray.origin.x) / (std::abs(ray.direction.x) < 1e-6f ? 1e-6f : ray.direction.x);
    if (tMin > tMax) std::swap(tMin, tMax);

    float tyMin = (bounds.min.y - ray.origin.y) / (std::abs(ray.direction.y) < 1e-6f ? 1e-6f : ray.direction.y);
    float tyMax = (bounds.max.y - ray.origin.y) / (std::abs(ray.direction.y) < 1e-6f ? 1e-6f : ray.direction.y);
    if (tyMin > tyMax) std::swap(tyMin, tyMax);

    if ((tMin > tyMax) || (tyMin > tMax)) return false;
    if (tyMin > tMin) tMin = tyMin;
    if (tyMax < tMax) tMax = tyMax;

    float tzMin = (bounds.min.z - ray.origin.z) / (std::abs(ray.direction.z) < 1e-6f ? 1e-6f : ray.direction.z);
    float tzMax = (bounds.max.z - ray.origin.z) / (std::abs(ray.direction.z) < 1e-6f ? 1e-6f : ray.direction.z);
    if (tzMin > tzMax) std::swap(tzMin, tzMax);

    if ((tMin > tzMax) || (tzMin > tMax)) return false;
    if (tzMin > tMin) tMin = tzMin;
    if (tzMax < tMax) tMax = tzMax;

    tOut = tMin;
    return tOut >= 0.0f;
}

// --- 3D BUTTON WIDGET ---
Button3D::Button3D(const std::string& lbl, float x, float y, float z, float width, float height, std::function<void()> cb) {
    type = Widget3DType::Button;
    label = lbl;
    position = { x, y, z };
    defaultZ = z;
    currentZ = z;
    targetZ = z;
    onClick = cb;

    float halfW = width * 0.5f;
    float halfH = height * 0.5f;
    bounds.min = { x - halfW, y - halfH, z - 0.1f };
    bounds.max = { x + halfW, y + halfH, z + 0.2f };
}

void Button3D::updatePhysics(float deltaTime) {
    (void)deltaTime;
    currentZ += (targetZ - currentZ) * 0.25f;
    currentGlow += (targetGlow - currentGlow) * 0.25f;
}

bool Button3D::raycast(const Ray3D& ray, HitResult& hitOut) {
    float t = 0.0f;
    if (rayIntersectsAABB(ray, bounds, t)) {
        hitOut.hit = true;
        hitOut.distance = t;
        hitOut.widgetId = id;
        hitOut.point = { ray.origin.x + ray.direction.x * t, ray.origin.y + ray.direction.y * t, ray.origin.z + ray.direction.z * t };
        return true;
    }
    return false;
}

void Button3D::onPointerDown(const Vector3D& hitPoint) {
    (void)hitPoint;
    isPressed = true;
    targetZ = defaultZ - pressDepth;
    targetGlow = 2.5f;
    if (onClick) onClick();
}

void Button3D::onPointerDrag(float deltaX, float deltaY) {
    (void)deltaX; (void)deltaY;
}

void Button3D::onPointerUp() {
    isPressed = false;
    targetZ = defaultZ;
    targetGlow = 0.0f;
}

// --- 3D SLIDER WIDGET ---
Slider3D::Slider3D(const std::string& lbl, float x, float y, float z, float length, float minV, float maxV, float defaultVal, std::function<void(float)> cb) {
    type = Widget3DType::Slider;
    label = lbl;
    position = { x, y, z };
    trackLength = length;
    minVal = minV;
    maxVal = maxV;
    value = defaultVal;
    onChange = cb;

    float halfL = length * 0.5f;
    bounds.min = { x - halfL, y - 0.2f, z - 0.1f };
    bounds.max = { x + halfL, y + 0.2f, z + 0.2f };
}

void Slider3D::updatePhysics(float deltaTime) {
    (void)deltaTime;
    float norm = (value - minVal) / (maxVal - minVal);
    targetCapX = (norm - 0.5f) * trackLength;
    currentCapX += (targetCapX - currentCapX) * 0.25f;
    currentGlow += (targetGlow - currentGlow) * 0.25f;
}

bool Slider3D::raycast(const Ray3D& ray, HitResult& hitOut) {
    float t = 0.0f;
    if (rayIntersectsAABB(ray, bounds, t)) {
        hitOut.hit = true;
        hitOut.distance = t;
        hitOut.widgetId = id;
        hitOut.point = { ray.origin.x + ray.direction.x * t, ray.origin.y + ray.direction.y * t, ray.origin.z + ray.direction.z * t };
        return true;
    }
    return false;
}

void Slider3D::onPointerDown(const Vector3D& hitPoint) {
    (void)hitPoint;
    isDragging = true;
    targetGlow = 1.8f;
}

void Slider3D::onPointerDrag(float deltaX, float deltaY) {
    (void)deltaY;
    if (!isDragging) return;
    float norm = (value - minVal) / (maxVal - minVal);
    norm += deltaX * 0.005f;
    norm = std::max(0.0f, std::min(1.0f, norm));
    value = minVal + norm * (maxVal - minVal);
    if (onChange) onChange(value);
}

void Slider3D::onPointerUp() {
    isDragging = false;
    targetGlow = 0.0f;
}

// --- 3D KNOB WIDGET ---
Knob3D::Knob3D(const std::string& lbl, float x, float y, float z, float minV, float maxV, float defaultVal, std::function<void(float)> cb) {
    type = Widget3DType::Knob;
    label = lbl;
    position = { x, y, z };
    minVal = minV;
    maxVal = maxV;
    value = defaultVal;
    onChange = cb;

    bounds.min = { x - 0.4f, y - 0.4f, z - 0.1f };
    bounds.max = { x + 0.4f, y + 0.4f, z + 0.4f };
}

void Knob3D::updatePhysics(float deltaTime) {
    (void)deltaTime;
    float norm = (value - minVal) / (maxVal - minVal);
    targetAngle = (norm - 0.5f) * 2.8f; // ~160 degree rotation range
    currentAngle += (targetAngle - currentAngle) * 0.25f;
    currentGlow += (targetGlow - currentGlow) * 0.25f;
}

bool Knob3D::raycast(const Ray3D& ray, HitResult& hitOut) {
    float t = 0.0f;
    if (rayIntersectsAABB(ray, bounds, t)) {
        hitOut.hit = true;
        hitOut.distance = t;
        hitOut.widgetId = id;
        hitOut.point = { ray.origin.x + ray.direction.x * t, ray.origin.y + ray.direction.y * t, ray.origin.z + ray.direction.z * t };
        return true;
    }
    return false;
}

void Knob3D::onPointerDown(const Vector3D& hitPoint) {
    (void)hitPoint;
    isDragging = true;
    targetGlow = 1.8f;
}

void Knob3D::onPointerDrag(float deltaX, float deltaY) {
    if (!isDragging) return;
    float norm = (value - minVal) / (maxVal - minVal);
    norm += (-deltaY + deltaX) * 0.004f;
    norm = std::max(0.0f, std::min(1.0f, norm));
    value = minVal + norm * (maxVal - minVal);
    if (onChange) onChange(value);
}

void Knob3D::onPointerUp() {
    isDragging = false;
    targetGlow = 0.0f;
}

// --- 3D PIANO KEY WIDGET ---
PianoKey3D::PianoKey3D(int note, bool isBlack, float x, float y, float z, float width, float length, std::function<void(int)> cb) {
    type = Widget3DType::Container;
    noteNumber = note;
    isBlackKey = isBlack;
    position = { x, y, z };
    defaultZ = z;
    currentZ = z;
    targetZ = z;
    onNoteTrigger = cb;

    float halfW = width * 0.5f;
    float halfL = length * 0.5f;
    bounds.min = { x - halfW, y - halfL, z - 0.1f };
    bounds.max = { x + halfW, y + halfL, z + (isBlack ? 0.3f : 0.2f) };
}

void PianoKey3D::updatePhysics(float deltaTime) {
    (void)deltaTime;
    currentZ += (targetZ - currentZ) * 0.3f;
    currentGlow += (targetGlow - currentGlow) * 0.3f;
}

bool PianoKey3D::raycast(const Ray3D& ray, HitResult& hitOut) {
    float t = 0.0f;
    if (rayIntersectsAABB(ray, bounds, t)) {
        hitOut.hit = true;
        hitOut.distance = t;
        hitOut.widgetId = id;
        hitOut.point = { ray.origin.x + ray.direction.x * t, ray.origin.y + ray.direction.y * t, ray.origin.z + ray.direction.z * t };
        return true;
    }
    return false;
}

void PianoKey3D::onPointerDown(const Vector3D& hitPoint) {
    (void)hitPoint;
    isPressed = true;
    targetZ = defaultZ - 0.08f;
    targetGlow = 2.2f;
    if (onNoteTrigger) onNoteTrigger(noteNumber);
}

void PianoKey3D::onPointerDrag(float deltaX, float deltaY) {
    (void)deltaX; (void)deltaY;
}

void PianoKey3D::onPointerUp() {
    isPressed = false;
    targetZ = defaultZ;
    targetGlow = 0.0f;
}

// --- 3D UI MANAGER ---
Lab3DUIManager::Lab3DUIManager() {}
Lab3DUIManager::~Lab3DUIManager() {}

void Lab3DUIManager::update(float deltaTime) {
    for (auto& widget : m_widgets) {
        if (widget && widget->visible) {
            widget->updatePhysics(deltaTime);
        }
    }
}

void Lab3DUIManager::addWidget(std::shared_ptr<Widget3D> widget) {
    if (widget) {
        widget->id = s_nextId++;
        m_widgets.push_back(widget);
    }
}

bool Lab3DUIManager::handlePointerDown(const Ray3D& ray) {
    HitResult closestHit;
    closestHit.distance = 1e9f;

    for (auto& widget : m_widgets) {
        if (widget && widget->visible && widget->enabled) {
            HitResult hit;
            if (widget->raycast(ray, hit) && hit.distance < closestHit.distance) {
                closestHit = hit;
                m_activeWidget = widget;
            }
        }
    }

    if (m_activeWidget) {
        m_activeWidget->onPointerDown(closestHit.point);
        return true;
    }
    return false;
}

void Lab3DUIManager::handlePointerDrag(float deltaX, float deltaY) {
    if (m_activeWidget) {
        m_activeWidget->onPointerDrag(deltaX, deltaY);
    }
}

void Lab3DUIManager::handlePointerUp() {
    if (m_activeWidget) {
        m_activeWidget->onPointerUp();
        m_activeWidget = nullptr;
    }
}

} // namespace Lab3DUI
