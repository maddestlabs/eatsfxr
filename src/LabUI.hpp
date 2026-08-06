#ifndef LAB_UI_HPP
#define LAB_UI_HPP

#include <string>
#include <vector>
#include <memory>
#include <functional>
#include "nanovg.h"

namespace LabUI {

struct Bounds {
    float x = 0.0f;
    float y = 0.0f;
    float width = 0.0f;
    float height = 0.0f;

    bool contains(float px, float py) const {
        return (px >= x && px <= x + width && py >= y && py <= y + height);
    }
};

struct UIInputState {
    float mouseX = 0.0f;
    float mouseY = 0.0f;
    bool mouseDown = false;
    bool mousePressed = false;  // Just pressed this frame
    bool mouseReleased = false; // Just released this frame
    float scrollY = 0.0f;

    uint32_t activeWidgetId = 0;
    uint32_t focusedWidgetId = 0;
    std::string keyInputBuffer;
};

enum class WidgetType {
    Container,
    Label,
    Button,
    Slider,
    TextArea,
    ScrollView
};

class Widget {
public:
    uint32_t id = 0;
    WidgetType type = WidgetType::Container;
    Bounds bounds;
    bool visible = true;
    bool enabled = true;
    std::string name;

    std::vector<std::shared_ptr<Widget>> children;

    virtual ~Widget() = default;
    virtual void render(NVGcontext* ctx, const UIInputState& input) = 0;
    virtual void handleInput(UIInputState& input) = 0;
    
    void addChild(std::shared_ptr<Widget> child) {
        children.push_back(child);
    }
};

class LabelWidget : public Widget {
public:
    std::string text;
    float fontSize = 14.0f;
    NVGcolor color = nvgRGBA(240, 242, 245, 255);

    LabelWidget(const std::string& txt, float x, float y, float fSize = 14.0f) {
        type = WidgetType::Label;
        text = txt;
        bounds = { x, y, 200.0f, fSize + 4.0f };
        fontSize = fSize;
    }

    void render(NVGcontext* ctx, const UIInputState& input) override;
    void handleInput(UIInputState& input) override;
};

class ButtonWidget : public Widget {
public:
    std::string label;
    std::string icon;
    std::function<void()> onClick;
    bool isHovered = false;
    bool isPressed = false;

    ButtonWidget(const std::string& lbl, float x, float y, float w, float h, std::function<void()> cb = nullptr) {
        type = WidgetType::Button;
        label = lbl;
        bounds = { x, y, w, h };
        onClick = cb;
    }

    void render(NVGcontext* ctx, const UIInputState& input) override;
    void handleInput(UIInputState& input) override;
};

class SliderWidget : public Widget {
public:
    std::string label;
    float value = 0.5f;
    float minVal = 0.0f;
    float maxVal = 1.0f;
    std::function<void(float)> onChange;
    bool isDragging = false;

    SliderWidget(const std::string& lbl, float x, float y, float w, float h, float minV, float maxV, float defaultVal, std::function<void(float)> cb = nullptr) {
        type = WidgetType::Slider;
        label = lbl;
        bounds = { x, y, w, h };
        minVal = minV;
        maxVal = maxV;
        value = defaultVal;
        onChange = cb;
    }

    void render(NVGcontext* ctx, const UIInputState& input) override;
    void handleInput(UIInputState& input) override;
};

class TextAreaWidget : public Widget {
public:
    std::string text;
    float scrollOffset = 0.0f;
    int cursorPosition = 0;
    bool isFocused = false;
    std::function<void(const std::string&)> onTextChanged;

    TextAreaWidget(float x, float y, float w, float h) {
        type = WidgetType::TextArea;
        bounds = { x, y, w, h };
    }

    void render(NVGcontext* ctx, const UIInputState& input) override;
    void handleInput(UIInputState& input) override;
};

class LabUIManager {
public:
    LabUIManager();
    ~LabUIManager();

    void initialize(NVGcontext* nvgCtx);
    void updateAndRender(float viewportWidth, float viewportHeight, float dpr);

    void onPointerDown(float x, float y);
    void onPointerMove(float x, float y);
    void onPointerUp(float x, float y);
    void onScroll(float deltaY);
    void onKeyInput(const std::string& textStr);

    std::shared_ptr<Widget> getRootWidget() { return m_root; }

private:
    NVGcontext* m_nvg = nullptr;
    UIInputState m_input;
    std::shared_ptr<Widget> m_root;
    static uint32_t s_nextId;
};

} // namespace LabUI

#endif // LAB_UI_HPP
