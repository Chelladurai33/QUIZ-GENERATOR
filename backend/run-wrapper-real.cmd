@echo off
cd /d "C:\Users\Asus\Desktop\Quiz Generator\backend"
set "projectDir=C:\Users\Asus\Desktop\Quiz Generator\backend"
set "jar=%projectDir%\.mvn\wrapper\maven-wrapper.jar"
java -Dmaven.multiModuleProjectDirectory="%projectDir%" -cp "%jar%" org.apache.maven.wrapper.MavenWrapperMain -q -DskipTests compile
