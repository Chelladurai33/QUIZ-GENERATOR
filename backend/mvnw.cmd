@echo off
set MAVEN_PROJECTBASEDIR=%~dp0
if "%MAVEN_PROJECTBASEDIR:~-1%" == "\" set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%
set MVNW_DIR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper
set MAVEN_WRAPPER_JAR=%MVNW_DIR%\maven-wrapper.jar

if not exist "%MAVEN_WRAPPER_JAR%" (
    echo Maven wrapper jar not found: %MAVEN_WRAPPER_JAR%
    exit /b 1
)

java -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" -cp "%MAVEN_WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
