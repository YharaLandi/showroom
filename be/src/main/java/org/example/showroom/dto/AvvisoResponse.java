package org.example.showroom.dto;

import org.example.showroom.entities.Avviso;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

// Il token di disattivazione non compare: vive nella mail, non nelle API.
public record AvvisoResponse(
        UUID id,
        AutoResponse auto,
        BigDecimal soglia,
        boolean fasciaInviata,
        boolean inviato,
        boolean vendutaInviata,
        boolean attivo,
        Instant createdAt
) {
    public static AvvisoResponse of(Avviso a) {
        return new AvvisoResponse(a.getId(), AutoResponse.of(a.getAuto()), a.getSoglia(),
                a.isFasciaInviata(), a.isInviato(), a.isVendutaInviata(), a.isAttivo(), a.getCreatedAt());
    }
}
