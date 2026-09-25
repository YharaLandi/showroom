package org.example.showroom.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.LoginRequest;
import org.example.showroom.dto.LoginResponse;
import org.example.showroom.dto.RegisterRequest;
import org.example.showroom.dto.UserResponse;
import org.example.showroom.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PreAuthorize("permitAll()")
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }

    @PreAuthorize("permitAll()")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequest request) {
        userService.register(request);
    }

    // Invalida il JWT usato nella richiesta
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/logout")
    public void logout(@AuthenticationPrincipal Jwt jwt) {
        userService.logout(jwt.getTokenValue());
    }

    // Revoca il JWT attuale e ne restituisce uno nuovo con scadenza rinnovata
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/refresh")
    public LoginResponse refresh(@AuthenticationPrincipal Jwt jwt) {
        return userService.refresh(UUID.fromString(jwt.getSubject()), jwt.getTokenValue());
    }

    // Dati dell'utente del JWT, senza password
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return userService.me(UUID.fromString(jwt.getSubject()));
    }

    // Elimina il proprio account: avvisi, preferiti e sessioni spariscono con lui
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminaAccount(@AuthenticationPrincipal Jwt jwt) {
        userService.eliminaAccount(UUID.fromString(jwt.getSubject()));
    }
}
