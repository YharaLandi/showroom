package org.example.showroom.dto;

import java.time.Instant;

public record LoginResponse(
        String token,
        String tokenType,
        Instant expiresAt
) {
}
