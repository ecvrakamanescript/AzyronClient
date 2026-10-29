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

// Newest Gson that Minecraft ships (26.3), for the second test run
val gsonLatest = configurations.create("gsonLatest")

dependencies {
    // Minecraft provides Gson at runtime. Compiling against the oldest version (Minecraft 1.8.9)
    // makes sure the core only uses API that exists in every version.
    compileOnly("com.google.code.gson:gson:2.2.4")
    testImplementation("com.google.code.gson:gson:2.2.4")
    gsonLatest("com.google.code.gson:gson:2.14.0")

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

// Runs the same tests with Gson 2.14.0 instead of 2.2.4
val testGsonLatest = tasks.register<Test>("testGsonLatest") {
    description = "Runs the tests with the newest Gson that Minecraft ships."
    group = LifecycleBasePlugin.VERIFICATION_GROUP
    useJUnitPlatform()
    testClassesDirs = sourceSets.test.get().output.classesDirs
    classpath = sourceSets.test.get().runtimeClasspath.filter { !it.name.startsWith("gson-") } + gsonLatest
}

tasks.check {
    dependsOn(testGsonLatest)
}
