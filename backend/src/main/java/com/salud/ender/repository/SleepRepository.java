package com.salud.ender.repository;

import com.salud.ender.entity.Sleep;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SleepRepository extends JpaRepository<Sleep, Long> {
}
