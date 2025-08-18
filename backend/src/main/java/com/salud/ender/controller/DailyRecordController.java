package com.salud.ender.controller;

import com.salud.ender.entity.DailyRecord;
import com.salud.ender.repository.DailyRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "*")
public class DailyRecordController {
    @Autowired
    private DailyRecordRepository dailyRecordRepository;

    @PostMapping
    public DailyRecord createDailyRecord(@RequestBody DailyRecord record) {
        return dailyRecordRepository.save(record);
    }

    @GetMapping
    public List<DailyRecord> getAllDailyRecords() {
        return dailyRecordRepository.findAll();
    }
}
