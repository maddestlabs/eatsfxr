-- eatSFXR - Declarative Scriptable Lua UI Module
-- Provides script authors with UI panel, button, slider, and code editor layout constructors.

ui = {}

function ui.label(props)
    return {
        type = "label",
        text = props.text or "",
        x = props.x or 0,
        y = props.y or 0,
        font_size = props.font_size or 14
    }
end

function ui.button(props)
    return {
        type = "button",
        label = props.label or "Button",
        icon = props.icon or "",
        x = props.x or 0,
        y = props.y or 0,
        width = props.width or 120,
        height = props.height or 32,
        onClick = props.onClick
    }
end

function ui.slider(props)
    return {
        type = "slider",
        label = props.label or "Slider",
        x = props.x or 0,
        y = props.y or 0,
        width = props.width or 240,
        height = props.height or 24,
        min = props.min or 0.0,
        max = props.max or 1.0,
        value = props.value or 0.5,
        onChange = props.onChange
    }
end

function ui.code_editor(props)
    return {
        type = "code_editor",
        x = props.x or 0,
        y = props.y or 0,
        width = props.width or 500,
        height = props.height or 200,
        text = props.text or "",
        onEdit = props.onEdit
    }
end

function ui.window(props)
    return {
        type = "window",
        title = props.title or "eatSFXR Synth UI",
        x = props.x or 10,
        y = props.y or 10,
        width = props.width or 320,
        height = props.height or 600,
        children = props.children or {}
    }
end
