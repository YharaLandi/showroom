package org.example.showroom.dto;

import org.example.showroom.entities.Marca;

import java.util.UUID;

public record MarcaResponse(
        UUID id,
        String nome
) {
    public static MarcaResponse of(Marca m) {
        return new MarcaResponse(m.getId(), m.getNome());
    }
}
