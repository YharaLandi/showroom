package org.example.showroom.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ModificaAvvisoRequest(
        @NotNull @DecimalMin(value = "0.00", inclusive = false) @Digits(integer = 8, fraction = 2) BigDecimal soglia
) {
}
