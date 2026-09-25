package org.example.showroom.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "marche")
@Getter
@Setter
@NoArgsConstructor
public class Marca {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String nome;

    @OneToMany(mappedBy = "marca")
    private List<Auto> auto = new ArrayList<>();

    public Marca(String nome) {
        this.nome = nome;
    }
}
