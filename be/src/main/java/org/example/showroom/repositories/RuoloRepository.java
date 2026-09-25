package org.example.showroom.repositories;

import org.example.showroom.entities.Ruolo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RuoloRepository extends JpaRepository<Ruolo, UUID> {

    Optional<Ruolo> findByRuolo(String ruolo);

}
