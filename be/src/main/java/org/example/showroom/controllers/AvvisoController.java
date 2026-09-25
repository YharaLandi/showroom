package org.example.showroom.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.AvvisoResponse;
import org.example.showroom.dto.ModificaAvvisoRequest;
import org.example.showroom.dto.NuovoAvvisoRequest;
import org.example.showroom.dto.PageResponse;
import org.example.showroom.services.AvvisoService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/avvisi")
@RequiredArgsConstructor
public class AvvisoController {

    private final AvvisoService avvisoService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public PageResponse<AvvisoResponse> miei(@AuthenticationPrincipal Jwt jwt,
                                             @PageableDefault(size = 20) Pageable pageable) {
        return avvisoService.miei(UUID.fromString(jwt.getSubject()), pageable);
    }

    // Chi cambia /api/avvisi/<suo> in /api/avvisi/<altrui> riceve 404: l'avviso
    // si cerca per identificativo e per proprietario insieme.
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public AvvisoResponse dettaglio(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return avvisoService.dettaglio(UUID.fromString(jwt.getSubject()), id);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AvvisoResponse crea(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody NuovoAvvisoRequest request) {
        return avvisoService.crea(UUID.fromString(jwt.getSubject()), request);
    }

    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{id}")
    public AvvisoResponse modifica(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                   @Valid @RequestBody ModificaAvvisoRequest request) {
        return avvisoService.modifica(UUID.fromString(jwt.getSubject()), id, request);
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        avvisoService.elimina(UUID.fromString(jwt.getSubject()), id);
    }

    // Arrivo del link nella mail: senza accesso, perche' chi lo apre puo' benissimo
    // non essere collegato. A proteggerlo e' il token casuale, che vale una volta sola.
    @PreAuthorize("permitAll()")
    @PostMapping("/disattiva")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disattiva(@RequestParam String token) {
        avvisoService.disattivaConToken(token);
    }
}
