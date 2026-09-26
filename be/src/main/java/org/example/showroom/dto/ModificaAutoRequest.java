package org.example.showroom.dto;

import jakarta.validation.constraints.*;
import org.example.showroom.entities.Alimentazione;
import org.example.showroom.entities.StatoAuto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Campi facoltativi: si modifica solo quello che arriva valorizzato.
 * Il prezzo di vendita non e' qui: passa da CambioPrezzoRequest, perche' cambiarlo
 * fa scattare gli avvisi e merita un endpoint suo.
 */
public record ModificaAutoRequest(
        UUID marcaId,
        String modello,
        @Min(1900) Integer annoImmatricolazione,
        @PositiveOrZero Integer chilometraggio,
        Alimentazione alimentazione,
        @Positive Integer cilindrata,
        @Positive Integer potenza,
        @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal prezzoAcquisto,
        String descrizione,
        StatoAuto stato
) {
}
