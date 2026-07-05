# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
# Prefetch dependencies to leverage Docker cache layers
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/quiz-generator-api-0.0.1-SNAPSHOT.jar app.jar

# Install native Tesseract OCR binaries and English data for alpine so that Tess4J OCR works correctly
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
