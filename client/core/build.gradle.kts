plugins {
    `java-library`
}

group = providers.gradleProperty("maven_group").get()
version = providers.gradleProperty("mod_version").get()

base {
    archivesName = "azyron-core"
}

repositories {
    mavenCentral()
}

dependencies {
    // Only for the tests; JUnit is not part of the client JAR
    testImplementation(platform("org.junit:junit-bom:6.1.3"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
    // Java 8, so the core can also be used by the 1.8.9 client later
    options.release = 8
    // Newer JDKs warn that target 8 is deprecated; the warning is expected
    options.compilerArgs.add("-Xlint:-options")
}

// JUnit 6 needs Java 17; only the tests are compiled for it
tasks.compileTestJava {
    options.release = 17
}

tasks.test {
    useJUnitPlatform()
}
