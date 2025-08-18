package com.salud.ender.controller;

import com.salud.ender.entity.Meal;
import com.salud.ender.repository.MealRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/meals")
@CrossOrigin(origins = "*")
public class MealController {
    @Autowired
    private MealRepository mealRepository;

    @PostMapping
    public Meal createMeal(@RequestBody Meal meal) {
        return mealRepository.save(meal);
    }

    @GetMapping
    public List<Meal> getAllMeals() {
        return mealRepository.findAll();
    }
}
