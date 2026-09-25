package org.example.showroom.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

// Niente userId, niente "inviato": chi li aggiunge al corpo non cambia niente,
// perche' questo record non ha dove metterli.
public record NuovoAvvisoRequest(
        @NotNull UUID autoId,
        @NotNull @DecimalMin(value = "0.00", inclusive = false) @Digits(integer = 8, fraction = 2) BigDecimal soglia
) {
}
