// Build script for Minecraft 26.1 and newer (not obfuscated).
// Keep in sync with build.obfuscated.gradle.kts.
plugins {
    id("net.fabricmc.fabric-loom") version "1.19.3"
}

group = property("maven_group") as String
version = property("mod_version") as String

val minecraftVersion = stonecutter.current.version
val loaderVersion = property("loader_version") as String
val javaVersion = (property("java_version") as String).toInt()

base {
    archivesName = "azyron-client-$minecraftVersion"
}

dependencies {
    minecraft("com.mojang:minecraft:$minecraftVersion")
    implementation("net.fabricmc:fabric-loader:$loaderVersion")

    implementation(project(":core"))
    // Nest the core JAR inside the client JAR, so the launcher only needs one file
    include(project(":core"))
}

tasks.processResources {
    val properties = mapOf(
        "version" to project.version,
        "minecraft_version" to minecraftVersion,
        "loader_version" to loaderVersion,
        "java_version" to javaVersion,
    )
    inputs.properties(properties)
    filesMatching("fabric.mod.json") {
        expand(properties)
    }
}

java {
    // Compiles and runs (runClient) with the Java version this Minecraft version requires
    toolchain.languageVersion = JavaLanguageVersion.of(javaVersion)
}

tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
    options.release = javaVersion
}

tasks.jar {
    // Ship the license with the client
    from(rootDir.resolve("../LICENSE"))
}
