package org.example.showroom.events;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Pubblicato quando un amministratore abbassa il prezzo di un'auto.
 *
 * Porta solo gli identificativi, non gli avvisi gia' letti: chi lo ascolta lo fa
 * dopo il commit e rilegge da zero, cosi' lavora su dati scritti davvero. Se il
 * salvataggio fallisce non parte niente.
 */
public record PrezzoRibassatoEvent(
        UUID autoId,
        BigDecimal prezzoVecchio,
        BigDecimal prezzoNuovo
) {
}
