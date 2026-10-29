package io.github.ecvrakamanescript.azyron.core.ui;

import java.util.ArrayList;
import java.util.List;

/** Canvas for the tests that records every rectangle and text instead of drawing it. */
final class RecordingCanvas extends Canvas {
    static final class Rect {
        final int x1;
        final int y1;
        final int x2;
        final int y2;
        final int color;

        Rect(int x1, int y1, int x2, int y2, int color) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.color = color;
        }
    }

    static final class Text {
        final String text;
        final FontKey font;
        final int color;

        Text(String text, FontKey font, int color) {
            this.text = text;
            this.font = font;
            this.color = color;
        }
    }

    final List<Rect> rects = new ArrayList<>();
    final List<Text> texts = new ArrayList<>();

    RecordingCanvas(float scale) {
        super(scale);
    }

    @Override
    public int width() {
        return 1920;
    }

    @Override
    public int height() {
        return 1080;
    }

    @Override
    public void pushTransform(float x, float y, float scale) {
    }

    @Override
    public void popTransform() {
    }

    @Override
    public void pushClip(int x, int y, int width, int height) {
    }

    @Override
    public void popClip() {
    }

    @Override
    protected void drawRect(int x1, int y1, int x2, int y2, int color) {
        rects.add(new Rect(x1, y1, x2, y2, color));
    }

    @Override
    protected void drawText(String text, FontKey font, int x, int y, int lineHeight, int color) {
        texts.add(new Text(text, font, color));
    }

    @Override
    protected int measureText(String text, FontKey font) {
        return text.length() * font.pixelSize / 2;
    }
}
