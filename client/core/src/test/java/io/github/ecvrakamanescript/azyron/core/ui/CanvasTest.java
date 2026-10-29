package io.github.ecvrakamanescript.azyron.core.ui;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CanvasTest {
    private static final int WHITE = 0xFFFFFFFF;

    /** Alpha of each pixel of an area, summed from all recorded rectangles. */
    private static float[][] coverage(RecordingCanvas canvas, int width, int height) {
        float[][] pixels = new float[height][width];
        for (RecordingCanvas.Rect rect : canvas.rects) {
            for (int y = rect.y1; y < rect.y2; y++) {
                for (int x = rect.x1; x < rect.x2; x++) {
                    assertTrue(x >= 0 && x < width && y >= 0 && y < height, "Pixel outside: " + x + "," + y);
                    pixels[y][x] += Colors.alpha(rect.color) / 255f;
                }
            }
        }
        return pixels;
    }

    @ParameterizedTest
    @CsvSource({"100, 60, 8", "100, 60, 16", "48, 48, 24", "37, 21, 10", "200, 40, 20", "300, 200, 128"})
    void roundedRectCoversEachPixelAtMostOnceAndHasTheRightArea(int width, int height, int radius) {
        RecordingCanvas canvas = new RecordingCanvas(1);

        canvas.roundedRect(0, 0, width, height, radius, WHITE);

        float[][] pixels = coverage(canvas, width, height);
        double area = 0;
        for (float[] row : pixels) {
            for (float value : row) {
                assertTrue(value <= 1.0001f, "Pixel drawn twice");
                area += value;
            }
        }
        int r = Math.min(radius, Math.min(width, height) / 2);
        double expected = (double) width * height - (4 - Math.PI) * r * r;
        assertEquals(expected, area, expected * 0.002 + 2);
        // Centre and the straight parts of the edges are fully covered, the outer corner pixel is empty
        assertEquals(1f, pixels[height / 2][width / 2], 0.001f);
        if (width > 2 * r) {
            assertEquals(1f, pixels[0][width / 2], 0.001f);
        }
        if (height > 2 * r) {
            assertEquals(1f, pixels[height / 2][0], 0.001f);
        }
        assertEquals(0f, pixels[0][0], 0.001f);
        assertEquals(0f, pixels[height - 1][width - 1], 0.001f);
    }

    @Test
    void roundedRectIsSymmetric() {
        RecordingCanvas canvas = new RecordingCanvas(1);

        canvas.roundedRect(0, 0, 40, 30, 12, WHITE);

        float[][] pixels = coverage(canvas, 40, 30);
        for (int y = 0; y < 30; y++) {
            for (int x = 0; x < 40; x++) {
                assertEquals(pixels[y][x], pixels[y][39 - x], 0.001f);
                assertEquals(pixels[y][x], pixels[29 - y][x], 0.001f);
            }
        }
    }

    @Test
    void zeroRadiusIsAPlainRectangle() {
        RecordingCanvas canvas = new RecordingCanvas(1);

        canvas.roundedRect(5, 6, 10, 20, 0, WHITE);

        assertEquals(1, canvas.rects.size());
        RecordingCanvas.Rect rect = canvas.rects.get(0);
        assertEquals(5, rect.x1);
        assertEquals(26, rect.y2);
    }

    @Test
    void emptyShapesDrawNothing() {
        RecordingCanvas canvas = new RecordingCanvas(1);

        canvas.fill(0, 0, 0, 10, WHITE);
        canvas.fill(0, 0, 10, -1, WHITE);
        canvas.roundedRect(0, 0, 0, 10, 4, WHITE);
        canvas.fill(0, 0, 10, 10, 0x00FFFFFF);
        canvas.text("", TextStyle.BODY, 0, 0, WHITE);

        assertTrue(canvas.rects.isEmpty());
        assertTrue(canvas.texts.isEmpty());
    }

    @Test
    void opacityMultipliesAndNests() {
        RecordingCanvas canvas = new RecordingCanvas(1);

        canvas.pushOpacity(0.5f);
        canvas.fill(0, 0, 1, 1, 0xFF112233);
        canvas.pushOpacity(0.5f);
        canvas.fill(0, 0, 1, 1, 0xFF112233);
        canvas.popOpacity();
        canvas.popOpacity();
        canvas.fill(0, 0, 1, 1, 0xFF112233);

        assertEquals(0x80112233, canvas.rects.get(0).color);
        assertEquals(0x40112233, canvas.rects.get(1).color);
        assertEquals(0xFF112233, canvas.rects.get(2).color);
        assertThrows(IllegalStateException.class, canvas::popOpacity);
    }

    @Test
    void nearlyInvisibleTextIsSkipped() {
        RecordingCanvas canvas = new RecordingCanvas(1);

        canvas.pushOpacity(0.02f);
        canvas.text("Hidden", TextStyle.BODY, 0, 0, WHITE);
        canvas.popOpacity();
        canvas.text("Shown", TextStyle.BODY, 0, 0, WHITE);

        assertEquals(1, canvas.texts.size());
        assertEquals("Shown", canvas.texts.get(0).text);
    }

    @Test
    void textUsesTheFontForTheScale() {
        RecordingCanvas canvas = new RecordingCanvas(2);

        canvas.text("FPS", TextStyle.LABEL, 0, 0, WHITE);

        assertEquals(new FontKey(FontWeight.SEMIBOLD, 26), canvas.texts.get(0).font);
        assertEquals(34, canvas.lineHeight(TextStyle.LABEL));
        assertEquals(48, canvas.px(24));
    }
}
