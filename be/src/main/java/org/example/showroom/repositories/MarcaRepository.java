package org.example.showroom.repositories;

import org.example.showroom.entities.Marca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MarcaRepository extends JpaRepository<Marca, UUID> {

    Optional<Marca> findByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCase(String nome);

}
