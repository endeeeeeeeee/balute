package com.salud.ender.controller;

import com.salud.ender.entity.Sleep;
import com.salud.ender.repository.SleepRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sleeps")
@CrossOrigin(origins = "*")
public class SleepController {
    @Autowired
    private SleepRepository sleepRepository;

    @PostMapping
    public Sleep createSleep(@RequestBody Sleep sleep) {
        return sleepRepository.save(sleep);
    }

    @GetMapping
    public List<Sleep> getAllSleeps() {
        return sleepRepository.findAll();
    }
}
