package com.salud.ender.controller;

import com.salud.ender.entity.Workout;
import com.salud.ender.repository.WorkoutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@CrossOrigin(origins = "*")
public class WorkoutController {
    @Autowired
    private WorkoutRepository workoutRepository;

    @PostMapping
    public Workout createWorkout(@RequestBody Workout workout) {
        return workoutRepository.save(workout);
    }

    @GetMapping
    public List<Workout> getAllWorkouts() {
        return workoutRepository.findAll();
    }
}
