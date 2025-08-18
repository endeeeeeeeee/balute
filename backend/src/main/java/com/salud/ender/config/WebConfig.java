package com.salud.ender.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración global de CORS para permitir todas las peticiones desde cualquier origen,
 * con los métodos y cabeceras necesarios.
 *
 * NOTA: Esta clase le dice al servidor que acepte solicitudes de cualquier sitio web,
 * lo cual es ideal para el desarrollo y para APIs públicas.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Aplica la configuración a todas las rutas de la API
                .allowedOrigins("*") // Permite peticiones de cualquier origen (sitio web)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Permite todos los métodos HTTP comunes
                .allowedHeaders("*"); // Permite todas las cabeceras HTTP en las peticiones
    }
}
