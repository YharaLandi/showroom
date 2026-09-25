package org.example.showroom.repositories;

import org.example.showroom.entities.Auto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface AutoRepository extends JpaRepository<Auto, UUID>, JpaSpecificationExecutor<Auto> {

    Optional<Auto> findByTelaioIgnoreCase(String telaio);

    boolean existsByTelaioIgnoreCase(String telaio);

    // Marca caricata nella stessa query (JOIN), niente N+1
    @Override
    @EntityGraph(attributePaths = "marca")
    Page<Auto> findAll(Specification<Auto> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "marca")
    Optional<Auto> findById(UUID id);

}
