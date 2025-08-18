package com.salud.ender.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
public class Meal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Temporal(TemporalType.DATE)
    private Date fecha;

    private String desayuno;
    private String almuerzo;
    private String cena;
    private String snacks;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Date getFecha() { return fecha; }
    public void setFecha(Date fecha) { this.fecha = fecha; }

    public String getDesayuno() { return desayuno; }
    public void setDesayuno(String desayuno) { this.desayuno = desayuno; }

    public String getAlmuerzo() { return almuerzo; }
    public void setAlmuerzo(String almuerzo) { this.almuerzo = almuerzo; }

    public String getCena() { return cena; }
    public void setCena(String cena) { this.cena = cena; }

    public String getSnacks() { return snacks; }
    public void setSnacks(String snacks) { this.snacks = snacks; }
}
