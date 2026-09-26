package org.example.showroom.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.*;
import org.example.showroom.services.AutoService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/auto")
@RequiredArgsConstructor
public class AutoController {

    private final AutoService autoService;

    // ---------- catalogo pubblico ----------

    // Esempio: /api/auto?q=panda&prezzoMax=9000&sort=prezzo,asc&page=0&size=12
    // Le bozze non compaiono e non c'e' parametro per farle comparire.
    @PreAuthorize("permitAll()")
    @GetMapping
    public PageResponse<AutoResponse> catalogo(@ModelAttribute AutoSearchParams params,
                                               @PageableDefault(size = 12) Pageable pageable) {
        return autoService.catalogo(params, pageable);
    }

    @PreAuthorize("permitAll()")
    @GetMapping("/{id}")
    public AutoResponse dettaglio(@PathVariable UUID id) {
        return autoService.dettaglio(id);
    }

    // ---------- area amministrativa ----------

    // Qui compaiono anche le bozze e il prezzo d'acquisto
    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @GetMapping("/admin")
    public PageResponse<AutoAdminResponse> catalogoAdmin(@ModelAttribute AutoSearchParams params,
                                                         @PageableDefault(size = 20) Pageable pageable) {
        return autoService.catalogoAdmin(params, pageable);
    }

    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @GetMapping("/admin/{id}")
    public AutoAdminResponse dettaglioAdmin(@PathVariable UUID id) {
        return autoService.dettaglioAdmin(id);
    }

    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AutoAdminResponse crea(@Valid @RequestBody NuovaAutoRequest request) {
        return autoService.crea(request);
    }

    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @PatchMapping("/{id}")
    public AutoAdminResponse modifica(@PathVariable UUID id, @Valid @RequestBody ModificaAutoRequest request) {
        return autoService.modifica(id, request);
    }

    // Cambiare il prezzo spetta all'amministratore: un utente collegato che ci
    // prova riceve 403, e se il prezzo scende sotto una soglia parte la mail.
    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @PatchMapping("/{id}/prezzo")
    public AutoAdminResponse cambiaPrezzo(@PathVariable UUID id, @Valid @RequestBody CambioPrezzoRequest request) {
        return autoService.cambiaPrezzo(id, request);
    }

    // ---------- foto ----------

    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @PostMapping("/{id}/foto")
    public AutoAdminResponse caricaFoto(@PathVariable UUID id, @RequestParam("file") MultipartFile file) {
        return autoService.caricaFoto(id, file);
    }

    // Pubblica: e' la stessa immagine che finisce nel catalogo che chiunque puo' sfogliare
    @PreAuthorize("permitAll()")
    @GetMapping("/{id}/foto")
    public ResponseEntity<byte[]> foto(@PathVariable UUID id) {
        FotoAuto foto = autoService.foto(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(foto.contentType()))
                .body(foto.contenuto());
    }
}
