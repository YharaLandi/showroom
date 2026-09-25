package org.example.showroom.repositories;

import org.example.showroom.entities.TokenJwt;
import org.example.showroom.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TokenJwtRepository extends JpaRepository<TokenJwt, UUID> {

    Optional<TokenJwt> findByToken(String token);

    List<TokenJwt> findByUserAndRevocatoFalse(User user);

    void deleteByUser(User user);

}
