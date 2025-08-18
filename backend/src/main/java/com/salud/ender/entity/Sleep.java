package com.salud.ender.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
public class Sleep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Temporal(TemporalType.DATE)
    private Date fecha;

    private Double horasDormidas;
    private String horaAcostarse;
    private String horaLevantarse;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Date getFecha() { return fecha; }
    public void setFecha(Date fecha) { this.fecha = fecha; }

    public Double getHorasDormidas() { return horasDormidas; }
    public void setHorasDormidas(Double horasDormidas) { this.horasDormidas = horasDormidas; }

    public String getHoraAcostarse() { return horaAcostarse; }
    public void setHoraAcostarse(String horaAcostarse) { this.horaAcostarse = horaAcostarse; }

    public String getHoraLevantarse() { return horaLevantarse; }
    public void setHoraLevantarse(String horaLevantarse) { this.horaLevantarse = horaLevantarse; }
}
