package com.salud.ender.entity;

import jakarta.persistence.*;

@Entity
public class Schedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String dia;
    private String actividad;
    private String horaInicio;
    private String horaFin;
    private String tipo; // Ejemplo: "clase", "entrenamiento", "otro"

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDia() { return dia; }
    public void setDia(String dia) { this.dia = dia; }

    public String getActividad() { return actividad; }
    public void setActividad(String actividad) { this.actividad = actividad; }

    public String getHoraInicio() { return horaInicio; }
    public void setHoraInicio(String horaInicio) { this.horaInicio = horaInicio; }

    public String getHoraFin() { return horaFin; }
    public void setHoraFin(String horaFin) { this.horaFin = horaFin; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
}
