/*
 * NanoVG Implementation C module
 */

#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <string.h>
#include "nanovg.h"

struct NVGcontext {
    float width;
    float height;
    float dpr;
    int font;
};

NVGcolor nvgRGBA(unsigned char r, unsigned char g, unsigned char b, unsigned char a) {
    NVGcolor color;
    color.r = r / 255.0f;
    color.g = g / 255.0f;
    color.b = b / 255.0f;
    color.a = a / 255.0f;
    return color;
}

NVGcolor nvgRGBAf(float r, float g, float b, float a) {
    NVGcolor color;
    color.r = r;
    color.g = g;
    color.b = b;
    color.a = a;
    return color;
}

void nvgBeginFrame(NVGcontext* ctx, float windowWidth, float windowHeight, float devicePixelRatio) {
    if (!ctx) return;
    ctx->width = windowWidth;
    ctx->height = windowHeight;
    ctx->dpr = devicePixelRatio;
}

void nvgCancelFrame(NVGcontext* ctx) {
    (void)ctx;
}

void nvgEndFrame(NVGcontext* ctx) {
    (void)ctx;
}

void nvgFillColor(NVGcontext* ctx, NVGcolor color) { (void)ctx; (void)color; }
void nvgFillPaint(NVGcontext* ctx, NVGpaint paint) { (void)ctx; (void)paint; }
void nvgStrokeColor(NVGcontext* ctx, NVGcolor color) { (void)ctx; (void)color; }
void nvgStrokeWidth(NVGcontext* ctx, float width) { (void)ctx; (void)width; }

void nvgBeginPath(NVGcontext* ctx) { (void)ctx; }
void nvgMoveTo(NVGcontext* ctx, float x, float y) { (void)ctx; (void)x; (void)y; }
void nvgLineTo(NVGcontext* ctx, float x, float y) { (void)ctx; (void)x; (void)y; }
void nvgRect(NVGcontext* ctx, float x, float y, float w, float h) { (void)ctx; (void)x; (void)y; (void)w; (void)h; }
void nvgRoundedRect(NVGcontext* ctx, float x, float y, float w, float h, float r) { (void)ctx; (void)x; (void)y; (void)w; (void)h; (void)r; }
void nvgCircle(NVGcontext* ctx, float cx, float cy, float r) { (void)ctx; (void)cx; (void)cy; (void)r; }
void nvgFill(NVGcontext* ctx) { (void)ctx; }
void nvgStroke(NVGcontext* ctx) { (void)ctx; }

void nvgScissor(NVGcontext* ctx, float x, float y, float w, float h) { (void)ctx; (void)x; (void)y; (void)w; (void)h; }
void nvgResetScissor(NVGcontext* ctx) { (void)ctx; }

NVGpaint nvgLinearGradient(NVGcontext* ctx, float sx, float sy, float ex, float ey, NVGcolor icol, NVGcolor ocol) {
    NVGpaint p;
    memset(&p, 0, sizeof(p));
    p.innerColor = icol;
    p.outerColor = ocol;
    (void)ctx; (void)sx; (void)sy; (void)ex; (void)ey;
    return p;
}

NVGpaint nvgBoxGradient(NVGcontext* ctx, float x, float y, float w, float h, float r, float f, NVGcolor icol, NVGcolor ocol) {
    NVGpaint p;
    memset(&p, 0, sizeof(p));
    p.innerColor = icol;
    p.outerColor = ocol;
    (void)ctx; (void)x; (void)y; (void)w; (void)h; (void)r; (void)f;
    return p;
}

int nvgCreateFont(NVGcontext* ctx, const char* name, const char* filename) {
    (void)ctx; (void)name; (void)filename;
    return 1;
}

int nvgCreateFontMem(NVGcontext* ctx, const char* name, unsigned char* data, int ndata, int freeData) {
    (void)ctx; (void)name; (void)data; (void)ndata; (void)freeData;
    return 1;
}

void nvgFontSize(NVGcontext* ctx, float size) { (void)ctx; (void)size; }
void nvgFontFace(NVGcontext* ctx, const char* font) { (void)ctx; (void)font; }
void nvgTextAlign(NVGcontext* ctx, int align) { (void)ctx; (void)align; }
float nvgText(NVGcontext* ctx, float x, float y, const char* string, const char* end) {
    (void)ctx; (void)x; (void)y; (void)string; (void)end;
    return 0.0f;
}

void nvgTextBox(NVGcontext* ctx, float x, float y, float breakRowWidth, const char* string, const char* end) {
    (void)ctx; (void)x; (void)y; (void)breakRowWidth; (void)string; (void)end;
}
