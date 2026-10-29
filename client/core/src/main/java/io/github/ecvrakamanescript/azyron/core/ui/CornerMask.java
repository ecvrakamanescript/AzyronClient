package io.github.ecvrakamanescript.azyron.core.ui;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Pixels of one rounded corner (top left) with smooth edges. Each pixel's coverage is computed
 * once per radius with 8 x 8 samples; neighbouring fully covered pixels are merged into one run, so
 * a corner is drawn with a few rectangles per row.
 */
final class CornerMask {
    /** Corners larger than this are drawn with this radius. */
    static final int MAX_RADIUS = 128;

    private static final int SAMPLES = 8;
    private static final Map<Integer, CornerMask> CACHE = new HashMap<>();

    /** Horizontal run of pixels in one row of the corner, all with the same coverage (0 to 1). */
    static final class Run {
        final int row;
        final int column;
        final int length;
        final float coverage;

        Run(int row, int column, int length, float coverage) {
            this.row = row;
            this.column = column;
            this.length = length;
            this.coverage = coverage;
        }
    }

    final int radius;
    final List<Run> runs;

    private CornerMask(int radius) {
        this.radius = radius;
        this.runs = Collections.unmodifiableList(compute(radius));
    }

    static CornerMask of(int radius) {
        int clamped = Math.max(1, Math.min(MAX_RADIUS, radius));
        synchronized (CACHE) {
            CornerMask mask = CACHE.get(clamped);
            if (mask == null) {
                mask = new CornerMask(clamped);
                CACHE.put(clamped, mask);
            }
            return mask;
        }
    }

    private static List<Run> compute(int radius) {
        List<Run> runs = new ArrayList<>();
        double radiusSquared = (double) radius * radius;
        for (int row = 0; row < radius; row++) {
            int fullStart = -1;
            for (int column = 0; column < radius; column++) {
                float coverage = coverage(row, column, radius, radiusSquared);
                if (coverage >= 0.999f) {
                    if (fullStart < 0) {
                        fullStart = column;
                    }
                    continue;
                }
                if (fullStart >= 0) {
                    runs.add(new Run(row, fullStart, column - fullStart, 1f));
                    fullStart = -1;
                }
                if (coverage > 0.001f) {
                    runs.add(new Run(row, column, 1, coverage));
                }
            }
            if (fullStart >= 0) {
                runs.add(new Run(row, fullStart, radius - fullStart, 1f));
            }
        }
        return runs;
    }

    /** Share of the pixel inside the quarter circle around (radius, radius). */
    private static float coverage(int row, int column, int radius, double radiusSquared) {
        int inside = 0;
        for (int sy = 0; sy < SAMPLES; sy++) {
            double dy = row + (sy + 0.5) / SAMPLES - radius;
            for (int sx = 0; sx < SAMPLES; sx++) {
                double dx = column + (sx + 0.5) / SAMPLES - radius;
                if (dx * dx + dy * dy <= radiusSquared) {
                    inside++;
                }
            }
        }
        return inside / (float) (SAMPLES * SAMPLES);
    }
}
