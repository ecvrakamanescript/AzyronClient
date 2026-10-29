package io.github.ecvrakamanescript.azyron.core.ui;

/** One font of the UI: a weight at an exact size in real pixels. */
public final class FontKey implements Comparable<FontKey> {
    public final FontWeight weight;
    public final int pixelSize;

    public FontKey(FontWeight weight, int pixelSize) {
        if (pixelSize < 1) {
            throw new IllegalArgumentException("Invalid font size: " + pixelSize);
        }
        this.weight = weight;
        this.pixelSize = pixelSize;
    }

    /** Name of the font in the resources, for example "semibold_26". */
    public String id() {
        return weight.id + "_" + pixelSize;
    }

    @Override
    public int compareTo(FontKey other) {
        int byWeight = weight.compareTo(other.weight);
        return byWeight != 0 ? byWeight : Integer.compare(pixelSize, other.pixelSize);
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof FontKey && compareTo((FontKey) other) == 0;
    }

    @Override
    public int hashCode() {
        return weight.hashCode() * 31 + pixelSize;
    }

    @Override
    public String toString() {
        return id();
    }
}
