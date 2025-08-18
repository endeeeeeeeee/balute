package com.salud.ender.controller;

import com.salud.ender.entity.Expense;
import com.salud.ender.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {
    @Autowired
    private ExpenseRepository expenseRepository;

    @PostMapping
    public Expense createExpense(@RequestBody Expense expense) {
        return expenseRepository.save(expense);
    }

    @GetMapping
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }
}
