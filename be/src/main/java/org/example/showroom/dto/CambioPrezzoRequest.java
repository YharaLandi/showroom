package org.example.showroom.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

// Endpoint separato dalla modifica: e' il gesto che puo' far partire le mail.
public record CambioPrezzoRequest(
        @NotNull @DecimalMin(value = "0.00", inclusive = false) @Digits(integer = 8, fraction = 2) BigDecimal prezzo
) {
}
