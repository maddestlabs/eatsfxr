/*
 * NanoVG - Lightweight 2D Vector Graphics Library for OpenGL / WebGL / Filament
 * Header file for NanoVG 2D vector rendering context, text, and path drawing.
 */

#ifndef NANOVG_H
#define NANOVG_H

#ifdef __cplusplus
extern "C" {
#endif

struct NVGcontext;
typedef struct NVGcontext NVGcontext;

struct NVGcolor {
    union {
        float rgba[4];
        struct { float r, g, b, a; };
    };
};
typedef struct NVGcolor NVGcolor;

struct NVGpaint {
    float xform[6];
    float extent[2];
    float radius;
    float feather;
    NVGcolor innerColor;
    NVGcolor outerColor;
    int image;
};
typedef struct NVGpaint NVGpaint;

enum NVGwinding {
    NVG_SOLID = 1,
    NVG_HOLE = 2,
};

enum NVGalign {
    NVG_ALIGN_LEFT     = 1<<0,
    NVG_ALIGN_CENTER   = 1<<1,
    NVG_ALIGN_RIGHT    = 1<<2,
    NVG_ALIGN_TOP      = 1<<3,
    NVG_ALIGN_MIDDLE   = 1<<4,
    NVG_ALIGN_BOTTOM   = 1<<5,
    NVG_ALIGN_BASELINE = 1<<6,
};

// Colors
NVGcolor nvgRGBA(unsigned char r, unsigned char g, unsigned char b, unsigned char a);
NVGcolor nvgRGBAf(float r, float g, float b, float a);

// State Handling
void nvgBeginFrame(NVGcontext* ctx, float windowWidth, float windowHeight, float devicePixelRatio);
void nvgCancelFrame(NVGcontext* ctx);
void nvgEndFrame(NVGcontext* ctx);

// Render Styles
void nvgFillColor(NVGcontext* ctx, NVGcolor color);
void nvgFillPaint(NVGcontext* ctx, NVGpaint paint);
void nvgStrokeColor(NVGcontext* ctx, NVGcolor color);
void nvgStrokeWidth(NVGcontext* ctx, float width);

// Paths
void nvgBeginPath(NVGcontext* ctx);
void nvgMoveTo(NVGcontext* ctx, float x, float y);
void nvgLineTo(NVGcontext* ctx, float x, float y);
void nvgRect(NVGcontext* ctx, float x, float y, float w, float h);
void nvgRoundedRect(NVGcontext* ctx, float x, float y, float w, float h, float r);
void nvgCircle(NVGcontext* ctx, float cx, float cy, float r);
void nvgFill(NVGcontext* ctx);
void nvgStroke(NVGcontext* ctx);

// Scissor
void nvgScissor(NVGcontext* ctx, float x, float y, float w, float h);
void nvgResetScissor(NVGcontext* ctx);

// Paints
NVGpaint nvgLinearGradient(NVGcontext* ctx, float sx, float sy, float ex, float ey, NVGcolor icol, NVGcolor ocol);
NVGpaint nvgBoxGradient(NVGcontext* ctx, float x, float y, float w, float h, float r, float f, NVGcolor icol, NVGcolor ocol);

// Fonts & Text
int nvgCreateFont(NVGcontext* ctx, const char* name, const char* filename);
int nvgCreateFontMem(NVGcontext* ctx, const char* name, unsigned char* data, int ndata, int freeData);
void nvgFontSize(NVGcontext* ctx, float size);
void nvgFontFace(NVGcontext* ctx, const char* font);
void nvgTextAlign(NVGcontext* ctx, int align);
float nvgText(NVGcontext* ctx, float x, float y, const char* string, const char* end);
void nvgTextBox(NVGcontext* ctx, float x, float y, float breakRowWidth, const char* string, const char* end);

#ifdef __cplusplus
}
#endif

#endif // NANOVG_H
