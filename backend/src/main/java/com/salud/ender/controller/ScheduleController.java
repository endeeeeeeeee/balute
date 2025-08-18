package com.salud.ender.controller;

import com.salud.ender.entity.Schedule;
import com.salud.ender.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "*")
public class ScheduleController {
    @Autowired
    private ScheduleRepository scheduleRepository;

    @PostMapping
    public Schedule createSchedule(@RequestBody Schedule schedule) {
        return scheduleRepository.save(schedule);
    }

    @GetMapping
    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }
}
