package org.example.showroom.repositories;

import org.example.showroom.entities.Ruolo;
import org.example.showroom.entities.RuoloUtente;
import org.example.showroom.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RuoloUtenteRepository extends JpaRepository<RuoloUtente, UUID> {

    List<RuoloUtente> findByUser(User user);

    boolean existsByUserAndRuolo(User user, Ruolo ruolo);

    Optional<RuoloUtente> findByUserAndRuolo(User user, Ruolo ruolo);

    void deleteByUser(User user);

}
