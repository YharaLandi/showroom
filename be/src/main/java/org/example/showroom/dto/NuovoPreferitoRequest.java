package org.example.showroom.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

// Solo l'auto: il proprietario e' chi presenta il JWT, non un campo del corpo.
public record NuovoPreferitoRequest(
        @NotNull UUID autoId
) {
}
