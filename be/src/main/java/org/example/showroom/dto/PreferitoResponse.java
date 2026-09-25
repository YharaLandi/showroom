package org.example.showroom.dto;

import org.example.showroom.entities.Preferito;

import java.time.Instant;
import java.util.UUID;

// Porta con se' l'auto in versione pubblica: un preferito non e' un modo
// obliquo per leggere il prezzo d'acquisto.
public record PreferitoResponse(
        UUID id,
        AutoResponse auto,
        Instant createdAt
) {
    public static PreferitoResponse of(Preferito p) {
        return new PreferitoResponse(p.getId(), AutoResponse.of(p.getAuto()), p.getCreatedAt());
    }
}
