package com.salud.ender.repository;

import com.salud.ender.entity.DailyRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyRecordRepository extends JpaRepository<DailyRecord, Long> {
}
