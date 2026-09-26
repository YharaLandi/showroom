package org.example.showroom.events;

import java.util.UUID;

/**
 * Pubblicato quando un amministratore segna un'auto come venduta.
 *
 * Solo se e' una transizione vera: risegnare come venduta un'auto gia' venduta
 * non pubblica un secondo evento (lo controlla AutoService prima di pubblicare).
 */
public record AutoVendutaEvent(
        UUID autoId
) {
}
