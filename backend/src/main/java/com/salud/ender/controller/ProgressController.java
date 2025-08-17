package main.java.com.salud.ender.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.ArrayList;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Permite peticiones desde cualquier origen
public class ProgressController {

    private static final List<Map<String, Object>> progresos = new ArrayList<>();

    @PostMapping("/progress")
    public ResponseEntity<Map<String, Object>> saveProgress(@RequestBody Map<String, Object> payload) {
        payload.put("fecha", LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        progresos.add(payload);
        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Progreso guardado con éxito!");
        response.put("progreso", payload);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/last-weight")
    public ResponseEntity<Map<String, Object>> getLastWeight() {
        Map<String, Object> response = new HashMap<>();
        if (!progresos.isEmpty()) {
            Map<String, Object> last = progresos.get(progresos.size() - 1);
            response.put("ultimoPeso", last.get("peso"));
            response.put("fecha", last.get("fecha"));
        } else {
            response.put("ultimoPeso", null);
            response.put("fecha", null);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/weekly-expense")
    public ResponseEntity<Map<String, Object>> getWeeklyExpense() {
        double total = 0;
        LocalDate now = LocalDate.now();
        for (Map<String, Object> prog : progresos) {
            String fechaStr = (String) prog.get("fecha");
            if (fechaStr != null) {
                LocalDate fecha = LocalDate.parse(fechaStr);
                if (!fecha.isBefore(now.minusDays(6))) {
                    try {
                        total += Double.parseDouble(prog.get("gasto").toString());
                    } catch (Exception ignored) {}
                }
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("gastoSemanal", total);
        return ResponseEntity.ok(response);
    }
}