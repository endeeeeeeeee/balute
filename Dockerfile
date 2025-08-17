# Usa una imagen base de Nginx, que es un servidor web muy ligero.
FROM nginx:alpine

# Copia los archivos de tu frontend a la carpeta de Nginx.
COPY frontend/ /usr/share/nginx/html

# Expone el puerto 80, que es el estándar para HTTP.
EXPOSE 80

# Comando para iniciar Nginx y mantener el contenedor en ejecución.
CMD ["nginx", "-g", "daemon off;"]