package org.example.showroom.services;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.example.showroom.dto.AutoSearchParams;
import org.example.showroom.entities.Auto;
import org.example.showroom.entities.Marca;
import org.springframework.data.jpa.domain.Specification;

import java.time.Year;
import java.util.ArrayList;
import java.util.List;

import static org.example.showroom.services.SearchUtils.like;
import static org.example.showroom.services.SearchUtils.presente;

final class AutoSpecifications {

    private AutoSpecifications() {
    }

    /**
     * @param soloPubblicate true per il catalogo pubblico: le bozze restano fuori.
     *                       Lo decide il service in base all'endpoint, non il client.
     */
    static Specification<Auto> da(AutoSearchParams p, boolean soloPubblicate) {
        return (root, query, cb) -> {
            Join<Auto, Marca> marca = root.join("marca");
            List<Predicate> filtri = new ArrayList<>();

            if (soloPubblicate) {
                filtri.add(cb.isFalse(root.get("bozza")));
            }
            if (presente(p.q())) {
                filtri.add(cb.or(
                        like(cb, marca.get("nome"), p.q()),
                        like(cb, root.get("modello"), p.q()),
                        like(cb, root.get("descrizione"), p.q())));
            }
            if (presente(p.modello())) filtri.add(like(cb, root.get("modello"), p.modello()));
            if (p.marcaId() != null) filtri.add(cb.equal(marca.get("id"), p.marcaId()));
            if (p.alimentazione() != null) filtri.add(cb.equal(root.get("alimentazione"), p.alimentazione()));
            if (p.annoDa() != null) filtri.add(cb.greaterThanOrEqualTo(root.get("annoImmatricolazione"), Year.of(p.annoDa())));
            if (p.annoA() != null) filtri.add(cb.lessThanOrEqualTo(root.get("annoImmatricolazione"), Year.of(p.annoA())));
            if (p.prezzoMin() != null) filtri.add(cb.greaterThanOrEqualTo(root.get("prezzo"), p.prezzoMin()));
            if (p.prezzoMax() != null) filtri.add(cb.lessThanOrEqualTo(root.get("prezzo"), p.prezzoMax()));
            if (p.kmMax() != null) filtri.add(cb.lessThanOrEqualTo(root.get("chilometraggio"), p.kmMax()));

            return cb.and(filtri.toArray(Predicate[]::new));
        };
    }
}
