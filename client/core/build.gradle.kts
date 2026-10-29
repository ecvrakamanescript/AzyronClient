plugins {
    `java-library`
}

group = providers.gradleProperty("maven_group").get()
version = providers.gradleProperty("mod_version").get()

base {
    archivesName = "azyron-core"
}

tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
    // Java 8, so the core can also be used by the 1.8.9 client later
    options.release = 8
    // Newer JDKs warn that target 8 is deprecated; the warning is expected
    options.compilerArgs.add("-Xlint:-options")
}
