# 🚀 Salud Ender

Mi sistema personal de gestión de salud física, construido con un backend de Java, un frontend estático y una base de datos MySQL, todo gestionado con Docker.

## Características

- Seguimiento de progreso (peso, medidas)
- Registro de gastos
- Calendario de entrenamiento

## Despliegue

Este proyecto se despliega en [Render.com](https://render.com) utilizando Docker.

## Desarrollo Local

Para ejecutar el proyecto localmente, usa Docker Compose:

```bash
docker-compose up --build

#### **`salud-ender/Dockerfile`**
Este **Dockerfile** es para desplegar el frontend en Render.

```dockerfile
# Usa una imagen base de Nginx, que es un servidor web muy ligero.
FROM nginx:alpine

# Copia los archivos de tu frontend a la carpeta de Nginx.
COPY frontend/ /usr/share/nginx/html

# Expone el puerto 80, que es el estándar para HTTP.
EXPOSE 80

# Comando para iniciar Nginx y mantener el contenedor en ejecución.
CMD ["nginx", "-g", "daemon off;"]