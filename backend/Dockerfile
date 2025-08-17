# Usa la imagen oficial de Maven para construir la aplicación.
FROM maven:3.8.5-openjdk-17 AS build

# Define el directorio de trabajo.
WORKDIR /app

# Copia los archivos de configuración de Maven.
COPY pom.xml .

# Descarga las dependencias para que no se vuelvan a descargar en cada build.
RUN mvn dependency:go-offline

# Copia el código fuente de la aplicación.
COPY src ./src

# Empaqueta la aplicación en un JAR ejecutable.
RUN mvn clean package -DskipTests

# Usa una imagen ligera de OpenJDK para el JAR ejecutable.
FROM openjdk:17-slim

# Define el directorio de trabajo.
WORKDIR /app

# Copia el JAR del paso anterior.
COPY --from=build /app/target/*.jar ./app.jar

# Expone el puerto 8080.
EXPOSE 8080

# Comando para ejecutar la aplicación.
CMD ["java", "-jar", "app.jar"]