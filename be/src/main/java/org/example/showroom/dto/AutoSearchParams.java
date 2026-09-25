package org.example.showroom.dto;

import org.example.showroom.entities.Alimentazione;

import java.math.BigDecimal;
import java.util.UUID;

// Filtri del catalogo da query string, tutti facoltativi e combinati in AND.
// Non c'e' un filtro "bozza": il catalogo pubblico le esclude sempre, e non e'
// una scelta che il client possa ribaltare passando un parametro.
public record AutoSearchParams(
        String q,                  // testo libero su marca, modello e descrizione
        String modello,
        UUID marcaId,
        Alimentazione alimentazione,
        Integer annoDa,
        Integer annoA,
        BigDecimal prezzoMin,
        BigDecimal prezzoMax,
        Integer kmMax
) {
}
