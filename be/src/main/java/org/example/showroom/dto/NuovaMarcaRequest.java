package org.example.showroom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NuovaMarcaRequest(
        @NotBlank @Size(max = 60) String nome
) {
}
