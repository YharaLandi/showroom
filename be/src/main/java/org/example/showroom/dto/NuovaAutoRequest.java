package org.example.showroom.dto;

import jakarta.validation.constraints.*;
import org.example.showroom.entities.Alimentazione;

import java.math.BigDecimal;
import java.util.UUID;

// L'auto nasce sempre come bozza: non c'e' un campo per pubblicarla subito.
public record NuovaAutoRequest(
        @NotBlank @Size(min = 11, max = 17) String telaio,
        @NotNull UUID marcaId,
        @NotBlank String modello,
        @NotNull @Min(1900) Integer annoImmatricolazione,
        @NotNull @PositiveOrZero Integer chilometraggio,
        @NotNull Alimentazione alimentazione,
        // Facoltativa: le elettriche non hanno cilindrata
        @Positive Integer cilindrata,
        @NotNull @Positive Integer potenza,
        @NotNull @DecimalMin(value = "0.00", inclusive = false) @Digits(integer = 8, fraction = 2) BigDecimal prezzo,
        @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal prezzoAcquisto,
        @NotBlank String descrizione,
        String path
) {
}
