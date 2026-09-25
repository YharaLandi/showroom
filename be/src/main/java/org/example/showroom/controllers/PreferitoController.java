package org.example.showroom.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.NuovoPreferitoRequest;
import org.example.showroom.dto.PageResponse;
import org.example.showroom.dto.PreferitoResponse;
import org.example.showroom.services.PreferitoService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/preferiti")
@RequiredArgsConstructor
public class PreferitoController {

    private final PreferitoService preferitoService;

    // Il proprietario e' sempre chi presenta il JWT: nessun endpoint accetta un userId
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public PageResponse<PreferitoResponse> miei(@AuthenticationPrincipal Jwt jwt,
                                                @PageableDefault(size = 20) Pageable pageable) {
        return preferitoService.miei(UUID.fromString(jwt.getSubject()), pageable);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PreferitoResponse aggiungi(@AuthenticationPrincipal Jwt jwt,
                                      @Valid @RequestBody NuovoPreferitoRequest request) {
        return preferitoService.aggiungi(UUID.fromString(jwt.getSubject()), request);
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rimuovi(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        preferitoService.rimuovi(UUID.fromString(jwt.getSubject()), id);
    }
}
