-- eatSFXR - Declarative 3D Scriptable Lua UI Module
-- Allows script authors to construct and position physical 3D UI controls in Filament space.

ui3d = {}

function ui3d.button(props)
    return {
        type = "button3d",
        id = props.id or "btn_custom",
        label = props.label or "Button",
        icon = props.icon or "",
        position = props.position or { x = 0.0, y = 0.0, z = 0.1 },
        size = props.size or { w = 1.0, h = 0.5, d = 0.2 },
        color = props.color or "orange",
        onClick = props.onClick
    }
end

function ui3d.slider(props)
    return {
        type = "slider3d",
        id = props.id or "sld_custom",
        label = props.label or "Slider",
        position = props.position or { x = 0.0, y = 0.0, z = 0.1 },
        length = props.length or 2.0,
        min = props.min or 0.0,
        max = props.max or 1.0,
        value = props.value or 0.5,
        onChange = props.onChange
    }
end

function ui3d.knob(props)
    return {
        type = "knob3d",
        id = props.id or "knb_custom",
        label = props.label or "Knob",
        position = props.position or { x = 0.0, y = 0.0, z = 0.1 },
        min = props.min or 0.0,
        max = props.max or 1.0,
        value = props.value or 0.5,
        onChange = props.onChange
    }
end

function ui3d.display(props)
    return {
        type = "display3d",
        id = props.id or "lcd_custom",
        position = props.position or { x = 0.0, y = 0.0, z = 0.1 },
        size = props.size or { w = 4.0, h = 2.0 },
        text = props.text or ""
    }
end
