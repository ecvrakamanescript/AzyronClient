package io.github.ecvrakamanescript.azyron.core.module.setting;

import io.github.ecvrakamanescript.azyron.core.module.Ids;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/** One option out of a fixed list. Options are ids, so they can be stored and translated. */
public final class ChoiceSetting extends Setting<String> {
    private final List<String> options;

    public ChoiceSetting(String id, String defaultOption, String... options) {
        this(id, defaultOption, copyOptions(options));
    }

    private ChoiceSetting(String id, String defaultOption, List<String> options) {
        super(id, requireOption(defaultOption, options));
        this.options = options;
    }

    /** All options in their order in the menu. */
    public List<String> options() {
        return options;
    }

    @Override
    protected String normalize(String value) {
        return requireOption(value, options);
    }

    private static List<String> copyOptions(String[] options) {
        Objects.requireNonNull(options, "options");
        if (options.length == 0) {
            throw new IllegalArgumentException("A choice needs at least one option");
        }
        List<String> copy = new ArrayList<>(options.length);
        Set<String> seen = new HashSet<>();
        for (String option : options) {
            Ids.requireValid(option, "option");
            if (!seen.add(option)) {
                throw new IllegalArgumentException("Duplicate option \"" + option + "\"");
            }
            copy.add(option);
        }
        return Collections.unmodifiableList(copy);
    }

    private static String requireOption(String value, List<String> options) {
        if (!options.contains(value)) {
            throw new IllegalArgumentException("Unknown option: " + (value == null ? "null" : "\"" + value + "\""));
        }
        return value;
    }
}
