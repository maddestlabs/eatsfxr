#include "LabUI.hpp"
#include <algorithm>
#include <iostream>

namespace LabUI {

uint32_t LabUIManager::s_nextId = 1;

class RootContainerWidget : public Widget {
public:
    RootContainerWidget() {
        type = WidgetType::Container;
        bounds = { 0, 0, 1920, 1080 };
    }

    void render(NVGcontext* ctx, const UIInputState& input) override {
        for (auto& child : children) {
            if (child && child->visible) {
                child->render(ctx, input);
            }
        }
    }

    void handleInput(UIInputState& input) override {
        for (auto& child : children) {
            if (child && child->visible && child->enabled) {
                child->handleInput(input);
            }
        }
    }
};

// --- LABEL WIDGET ---
void LabelWidget::render(NVGcontext* ctx, const UIInputState& input) {
    (void)input;
    nvgFontSize(ctx, fontSize);
    nvgFillColor(ctx, color);
    nvgTextAlign(ctx, NVG_ALIGN_LEFT | NVG_ALIGN_TOP);
    nvgText(ctx, bounds.x, bounds.y, text.c_str(), nullptr);
}

void LabelWidget::handleInput(UIInputState& input) {
    (void)input;
}

// --- BUTTON WIDGET ---
void ButtonWidget::render(NVGcontext* ctx, const UIInputState& input) {
    isHovered = bounds.contains(input.mouseX, input.mouseY);

    NVGcolor bg = isPressed ? nvgRGBA(242, 101, 34, 200) :
                  (isHovered ? nvgRGBA(242, 101, 34, 140) : nvgRGBA(255, 255, 255, 20));
    NVGcolor border = isHovered ? nvgRGBA(242, 101, 34, 255) : nvgRGBA(255, 255, 255, 30);
    NVGcolor textCol = nvgRGBA(255, 255, 255, 255);

    // Draw Button Background
    nvgBeginPath(ctx);
    nvgRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 6.0f);
    nvgFillColor(ctx, bg);
    nvgFill(ctx);
    nvgStrokeColor(ctx, border);
    nvgStrokeWidth(ctx, 1.0f);
    nvgStroke(ctx);

    // Draw Label Text
    nvgFontSize(ctx, 12.0f);
    nvgFillColor(ctx, textCol);
    nvgTextAlign(ctx, NVG_ALIGN_CENTER | NVG_ALIGN_MIDDLE);
    nvgText(ctx, bounds.x + bounds.width * 0.5f, bounds.y + bounds.height * 0.5f, label.c_str(), nullptr);
}

void ButtonWidget::handleInput(UIInputState& input) {
    if (!enabled || !visible) return;

    if (bounds.contains(input.mouseX, input.mouseY)) {
        if (input.mousePressed) {
            isPressed = true;
            input.activeWidgetId = id;
        } else if (input.mouseReleased && isPressed) {
            isPressed = false;
            if (onClick) onClick();
        }
    } else if (input.mouseReleased) {
        isPressed = false;
    }
}

// --- SLIDER WIDGET ---
void SliderWidget::render(NVGcontext* ctx, const UIInputState& input) {
    (void)input;
    float norm = (value - minVal) / (maxVal - minVal);
    norm = std::max(0.0f, std::min(1.0f, norm));

    // Label
    nvgFontSize(ctx, 11.0f);
    nvgFillColor(ctx, nvgRGBA(138, 147, 158, 255));
    nvgTextAlign(ctx, NVG_ALIGN_LEFT | NVG_ALIGN_MIDDLE);
    nvgText(ctx, bounds.x, bounds.y + bounds.height * 0.5f, label.c_str(), nullptr);

    // Slider Track
    float trackX = bounds.x + 80.0f;
    float trackW = bounds.width - 130.0f;
    float trackY = bounds.y + bounds.height * 0.5f - 2.0f;

    nvgBeginPath(ctx);
    nvgRoundedRect(ctx, trackX, trackY, trackW, 4.0f, 2.0f);
    nvgFillColor(ctx, nvgRGBA(0, 0, 0, 100));
    nvgFill(ctx);

    // Active Fill
    nvgBeginPath(ctx);
    nvgRoundedRect(ctx, trackX, trackY, trackW * norm, 4.0f, 2.0f);
    nvgFillColor(ctx, nvgRGBA(242, 101, 34, 255));
    nvgFill(ctx);

    // Knob Handle
    float handleX = trackX + trackW * norm;
    nvgBeginPath(ctx);
    nvgCircle(ctx, handleX, trackY + 2.0f, 6.0f);
    nvgFillColor(ctx, nvgRGBA(255, 255, 255, 255));
    nvgFill(ctx);

    // Value Readout
    char valStr[16];
    snprintf(valStr, sizeof(valStr), "%.2f", value);
    nvgFillColor(ctx, nvgRGBA(255, 255, 255, 255));
    nvgTextAlign(ctx, NVG_ALIGN_RIGHT | NVG_ALIGN_MIDDLE);
    nvgText(ctx, bounds.x + bounds.width, bounds.y + bounds.height * 0.5f, valStr, nullptr);
}

void SliderWidget::handleInput(UIInputState& input) {
    if (!enabled || !visible) return;

    float trackX = bounds.x + 80.0f;
    float trackW = bounds.width - 130.0f;

    if (input.mousePressed && bounds.contains(input.mouseX, input.mouseY)) {
        isDragging = true;
        input.activeWidgetId = id;
    }

    if (isDragging) {
        if (input.mouseDown) {
            float norm = (input.mouseX - trackX) / trackW;
            norm = std::max(0.0f, std::min(1.0f, norm));
            value = minVal + norm * (maxVal - minVal);
            if (onChange) onChange(value);
        } else {
            isDragging = false;
        }
    }
}

// --- TEXT AREA WIDGET ---
void TextAreaWidget::render(NVGcontext* ctx, const UIInputState& input) {
    (void)input;
    // Background Panel
    nvgBeginPath(ctx);
    nvgRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 8.0f);
    nvgFillColor(ctx, nvgRGBA(8, 10, 14, 240));
    nvgFill(ctx);
    nvgStrokeColor(ctx, isFocused ? nvgRGBA(52, 152, 219, 255) : nvgRGBA(255, 255, 255, 30));
    nvgStrokeWidth(ctx, 1.0f);
    nvgStroke(ctx);

    // Multi-line Monospaced Text
    nvgFontSize(ctx, 12.0f);
    nvgFillColor(ctx, nvgRGBA(142, 208, 255, 255));
    nvgTextAlign(ctx, NVG_ALIGN_LEFT | NVG_ALIGN_TOP);
    nvgTextBox(ctx, bounds.x + 12.0f, bounds.y + 12.0f - scrollOffset, bounds.width - 24.0f, text.c_str(), nullptr);
}

void TextAreaWidget::handleInput(UIInputState& input) {
    if (input.mousePressed) {
        isFocused = bounds.contains(input.mouseX, input.mouseY);
        if (isFocused) input.focusedWidgetId = id;
    }

    if (isFocused && !input.keyInputBuffer.empty()) {
        text += input.keyInputBuffer;
        if (onTextChanged) onTextChanged(text);
    }
}

// --- UI MANAGER ---
LabUIManager::LabUIManager() {
    m_root = std::make_shared<RootContainerWidget>();
}

LabUIManager::~LabUIManager() {}

void LabUIManager::initialize(NVGcontext* nvgCtx) {
    m_nvg = nvgCtx;
}

void LabUIManager::updateAndRender(float viewportWidth, float viewportHeight, float dpr) {
    if (!m_nvg) return;

    m_root->bounds = { 0, 0, viewportWidth, viewportHeight };
    m_root->handleInput(m_input);

    nvgBeginFrame(m_nvg, viewportWidth, viewportHeight, dpr);
    m_root->render(m_nvg, m_input);
    nvgEndFrame(m_nvg);

    // Reset frame input state flags
    m_input.mousePressed = false;
    m_input.mouseReleased = false;
    m_input.keyInputBuffer.clear();
}

void LabUIManager::onPointerDown(float x, float y) {
    m_input.mouseX = x;
    m_input.mouseY = y;
    m_input.mouseDown = true;
    m_input.mousePressed = true;
}

void LabUIManager::onPointerMove(float x, float y) {
    m_input.mouseX = x;
    m_input.mouseY = y;
}

void LabUIManager::onPointerUp(float x, float y) {
    m_input.mouseX = x;
    m_input.mouseY = y;
    m_input.mouseDown = false;
    m_input.mouseReleased = true;
}

void LabUIManager::onScroll(float deltaY) {
    m_input.scrollY += deltaY;
}

void LabUIManager::onKeyInput(const std::string& textStr) {
    m_input.keyInputBuffer += textStr;
}

} // namespace LabUI
