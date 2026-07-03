$projectDir = "C:\Users\Asus\Desktop\Quiz Generator\backend"
$jar = Join-Path $projectDir ".mvn\wrapper\maven-wrapper.jar"
if (-not (Test-Path $jar)) {
    Write-Error "Maven wrapper jar not found: $jar"
    exit 1
}

java -Dmaven.multiModuleProjectDirectory="$projectDir" -cp "$jar" org.apache.maven.wrapper.MavenWrapperMain -q -DskipTests compile
