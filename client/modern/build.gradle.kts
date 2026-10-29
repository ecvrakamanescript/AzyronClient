plugins {
    // Plugin for Minecraft versions that are not obfuscated (26.1 and newer)
    id("net.fabricmc.fabric-loom") version "1.19.3"
}

group = providers.gradleProperty("maven_group").get()
version = providers.gradleProperty("mod_version").get()

val minecraftVersion = providers.gradleProperty("minecraft_version").get()
val loaderVersion = providers.gradleProperty("loader_version").get()

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
    )
    inputs.properties(properties)
    filesMatching("fabric.mod.json") {
        expand(properties)
    }
}

tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
    // Minecraft 26.x requires Java 25
    options.release = 25
}

tasks.jar {
    // Ship the license with the client
    from(layout.projectDirectory.file("../../LICENSE"))
}
