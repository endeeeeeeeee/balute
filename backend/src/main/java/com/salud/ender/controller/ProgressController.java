package com.salud.ender.controller;

import com.salud.ender.entity.Progress;
import com.salud.ender.repository.ProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ProgressController {

    @Autowired
    private ProgressRepository progressRepository;

    @PostMapping("/progress")
    public String saveProgress(@RequestBody Map<String, Object> payload) {
        Progress progress = new Progress();
        progress.setPeso(Double.parseDouble(payload.get("peso").toString()));
        progress.setGasto(Double.parseDouble(payload.get("gasto").toString()));
        progress.setFecha(new Date());

        progressRepository.save(progress);
        return "Progreso guardado con éxito!";
    }

    @GetMapping("/progress")
    public List<Progress> getAllProgress() {
        return progressRepository.findAll();
    }
}