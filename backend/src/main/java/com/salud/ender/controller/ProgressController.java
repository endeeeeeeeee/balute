package com.salud.ender.controller;

import com.salud.ender.entity.Progress;
import com.salud.ender.repository.ProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.context.annotation.Bean;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/") // El @RequestMapping ahora maneja la ruta raíz
@CrossOrigin(origins = "*")
public class ProgressController {

    @Autowired
    private ProgressRepository progressRepository;

    // Endpoint para verificar que el servicio está activo
    // Responde a la URL raíz del servicio, por ejemplo, "https://<tu-app>.onrender.com/"
    @GetMapping
    public String getStatus() {
        return "El servicio de seguimiento de progreso está en funcionamiento. Puedes acceder a los endpoints en /api/progress";
    }

    // Endpoint para guardar el progreso
    @PostMapping("/api/progress")
    public String saveProgress(@RequestBody Map<String, Object> payload) {
        Progress progress = new Progress();
        progress.setPeso(Double.parseDouble(payload.get("peso").toString()));
        progress.setGasto(Double.parseDouble(payload.get("gasto").toString()));
        progress.setFecha(new Date());

        progressRepository.save(progress);
        return "Progreso guardado con éxito!";
    }

    // Endpoint para obtener todos los registros de progreso
    @GetMapping("/api/progress")
    public List<Progress> getAllProgress() {
        return progressRepository.findAll();
    }

    // Configuración global de CORS
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**").allowedOrigins("*");
            }
        };
    }
}
