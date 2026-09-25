package org.example.showroom.dto;

import org.example.showroom.entities.Alimentazione;
import org.example.showroom.entities.Auto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * L'auto come la vede il pubblico. Non ha un campo per prezzoAcquisto ne' per
 * bozza: non e' una questione di ricordarsi di non valorizzarli, e' che qui non
 * esistono e non c'e' modo di farceli uscire.
 */
public record AutoResponse(
        UUID id,
        String telaio,
        UUID marcaId,
        String marca,
        String modello,
        Integer annoImmatricolazione,
        Integer chilometraggio,
        Alimentazione alimentazione,
        BigDecimal prezzo,
        String descrizione,
        String path
) {
    public static AutoResponse of(Auto a) {
        return new AutoResponse(a.getId(), a.getTelaio(), a.getMarca().getId(), a.getMarca().getNome(),
                a.getModello(), a.getAnnoImmatricolazione().getValue(), a.getChilometraggio(),
                a.getAlimentazione(), a.getPrezzo(), a.getDescrizione(), a.getPath());
    }
}
