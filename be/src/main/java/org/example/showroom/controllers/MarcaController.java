package org.example.showroom.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.MarcaResponse;
import org.example.showroom.dto.NuovaMarcaRequest;
import org.example.showroom.services.MarcaService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marche")
@RequiredArgsConstructor
public class MarcaController {

    private final MarcaService marcaService;

    // Serve al menu a tendina dei filtri, anche a chi non ha fatto l'accesso
    @PreAuthorize("permitAll()")
    @GetMapping
    public List<MarcaResponse> tutte() {
        return marcaService.tutte();
    }

    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MarcaResponse crea(@Valid @RequestBody NuovaMarcaRequest request) {
        return marcaService.crea(request);
    }
}
