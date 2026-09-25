package org.example.showroom.dto;

import org.example.showroom.entities.Alimentazione;
import org.example.showroom.entities.Auto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

// L'auto come la vede un amministratore: in piu' il prezzo d'acquisto e se e' una bozza.
// Lo restituiscono solo gli endpoint protetti da hasAnyRole('Admin','SuperUser').
public record AutoAdminResponse(
        UUID id,
        String telaio,
        UUID marcaId,
        String marca,
        String modello,
        Integer annoImmatricolazione,
        Integer chilometraggio,
        Alimentazione alimentazione,
        BigDecimal prezzo,
        BigDecimal prezzoAcquisto,
        String descrizione,
        boolean bozza,
        String path,
        Instant createdAt
) {
    public static AutoAdminResponse of(Auto a) {
        return new AutoAdminResponse(a.getId(), a.getTelaio(), a.getMarca().getId(), a.getMarca().getNome(),
                a.getModello(), a.getAnnoImmatricolazione().getValue(), a.getChilometraggio(),
                a.getAlimentazione(), a.getPrezzo(), a.getPrezzoAcquisto(), a.getDescrizione(),
                a.isBozza(), a.getPath(), a.getCreatedAt());
    }
}
