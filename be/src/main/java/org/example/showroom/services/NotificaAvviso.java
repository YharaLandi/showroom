package org.example.showroom.services;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Quello che serve per spedire una mail di avviso, gia' estratto dal database.
 *
 * Si porta dietro i valori invece dell'entita' perche' la spedizione avviene
 * fuori dalla transazione: con un Avviso staccato, leggere l'utente o l'auto
 * darebbe LazyInitializationException.
 *
 * "token" e' il valore in chiaro che va nel link: a DB ne resta solo l'hash.
 *
 * "soglia" non serve per VENDUTA e resta null in quel caso: quella mail non
 * parla di un prezzo raggiunto.
 */
public record NotificaAvviso(
        UUID avvisoId,
        TipoNotifica tipo,
        String email,
        String nome,
        String marca,
        String modello,
        BigDecimal prezzo,
        BigDecimal soglia,
        String token
) {
}
