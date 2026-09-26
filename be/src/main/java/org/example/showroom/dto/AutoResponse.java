package org.example.showroom.dto;

import org.example.showroom.entities.Alimentazione;
import org.example.showroom.entities.Auto;
import org.example.showroom.entities.StatoAuto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * L'auto come la vede il pubblico. Non ha un campo per prezzoAcquisto: non e'
 * una questione di ricordarsi di non valorizzarlo, e' che qui non esiste e non
 * c'e' modo di farlo uscire.
 *
 * stato invece e' pubblico: chi arriva fin qui puo' vedere solo auto NUOVO o
 * DISPONIBILE (dettaglio() e catalogo() filtrano prima), quindi il valore che
 * esce non rivela mai una bozza ne' una vendita.
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
        Integer cilindrata,
        Integer potenza,
        BigDecimal prezzo,
        String descrizione,
        String path,
        StatoAuto stato,
        Instant createdAt
) {
    public static AutoResponse of(Auto a) {
        return new AutoResponse(a.getId(), a.getTelaio(), a.getMarca().getId(), a.getMarca().getNome(),
                a.getModello(), a.getAnnoImmatricolazione().getValue(), a.getChilometraggio(),
                a.getAlimentazione(), a.getCilindrata(), a.getPotenza(), a.getPrezzo(), a.getDescrizione(),
                a.getPath(), a.getStato(), a.getCreatedAt());
    }
}
