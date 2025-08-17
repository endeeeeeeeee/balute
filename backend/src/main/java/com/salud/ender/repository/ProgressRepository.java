package main.java.com.salud.ender.repository;

import com.salud.ender.entity.Progress;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgressRepository extends JpaRepository<Progress, Long> {
    // ...existing code...
}

