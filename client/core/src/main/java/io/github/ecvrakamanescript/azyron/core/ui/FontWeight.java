package io.github.ecvrakamanescript.azyron.core.ui;

/** The two weights of the UI font (Inter). */
public enum FontWeight {
    REGULAR("regular"),
    SEMIBOLD("semibold");

    /** Used in font ids and file names. */
    public final String id;

    FontWeight(String id) {
        this.id = id;
    }
}
