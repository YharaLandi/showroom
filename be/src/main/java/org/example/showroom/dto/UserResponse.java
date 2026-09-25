package org.example.showroom.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String nome,
        String cognome,
        List<String> ruoli,
        Instant createdAt
) {
}
