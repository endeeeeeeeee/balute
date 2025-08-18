package com.salud.ender.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.util.Date;

/**
 * Entidad que representa un registro de seguimiento diario.
 * Esta clase se mapea a una tabla en la base de datos llamada 'daily_record'.
 * Spring Data JPA creará automáticamente la tabla por ti.
 */
@Entity
public class DailyRecord {

    // Identificador único para cada registro.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Fecha del registro diario.
    @Temporal(TemporalType.DATE)
    private Date fecha;

    // Cómo se sintió el usuario en una escala del 1 al 5.
    private Integer feeling;

    // Indicador de si tuvo dolor de espalda.
    @Column(columnDefinition = "boolean default false")
    private Boolean backPain;

    // Indicador de si cumplió con la alimentación.
    @Column(columnDefinition = "boolean default false")
    private Boolean ateWell;

    // Indicador de si entrenó.
    @Column(columnDefinition = "boolean default false")
    private Boolean trained;

    // Indicador de si tomó la cantidad de agua necesaria.
    @Column(columnDefinition = "boolean default false")
    private Boolean drankWater;

    // Campo para notas adicionales del día.
    private String notes;

    // Getters y Setters para todos los campos.
    // Necesarios para que Spring pueda acceder y manipular los datos.

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Date getFecha() {
        return fecha;
    }

    public void setFecha(Date fecha) {
        this.fecha = fecha;
    }

    public Integer getFeeling() {
        return feeling;
    }

    public void setFeeling(Integer feeling) {
        this.feeling = feeling;
    }

    public Boolean getBackPain() {
        return backPain;
    }

    public void setBackPain(Boolean backPain) {
        this.backPain = backPain;
    }

    public Boolean getAteWell() {
        return ateWell;
    }

    public void setAteWell(Boolean ateWell) {
        this.ateWell = ateWell;
    }

    public Boolean getTrained() {
        return trained;
    }

    public void setTrained(Boolean trained) {
        this.trained = trained;
    }

    public Boolean getDrankWater() {
        return drankWater;
    }

    public void setDrankWater(Boolean drankWater) {
        this.drankWater = drankWater;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
