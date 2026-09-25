package org.example.showroom.repositories;

import org.example.showroom.entities.Preferito;
import org.example.showroom.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PreferitoRepository extends JpaRepository<Preferito, UUID> {

    // Sempre per id E proprietario: il preferito di un altro non si trova, quindi 404
    @EntityGraph(attributePaths = {"auto", "auto.marca"})
    Optional<Preferito> findByIdAndUser(UUID id, User user);

    @EntityGraph(attributePaths = {"auto", "auto.marca"})
    Page<Preferito> findByUser(User user, Pageable pageable);

    Optional<Preferito> findByUserAndAutoId(User user, UUID autoId);

    boolean existsByUserAndAutoId(User user, UUID autoId);

    void deleteByUser(User user);

}
