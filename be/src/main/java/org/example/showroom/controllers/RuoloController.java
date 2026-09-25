package org.example.showroom.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.CreaRuoloRequest;
import org.example.showroom.services.RuoloService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/role")
@RequiredArgsConstructor
public class RuoloController {

    private final RuoloService ruoloService;

    // Solo il SuperUser: un Admin non puo' crearne altri ne' promuovere se stesso
    @PreAuthorize("hasRole('SuperUser')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void crea(@Valid @RequestBody CreaRuoloRequest request) {
        ruoloService.crea(request.ruolo());
    }

    @PreAuthorize("hasRole('SuperUser')")
    @PostMapping("/grantAdmin/{userId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void grantAdmin(@PathVariable UUID userId) {
        ruoloService.grantAdmin(userId);
    }

    @PreAuthorize("hasRole('SuperUser')")
    @DeleteMapping("/revokeAdmin/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeAdmin(@PathVariable UUID userId) {
        ruoloService.revokeAdmin(userId);
    }
}
