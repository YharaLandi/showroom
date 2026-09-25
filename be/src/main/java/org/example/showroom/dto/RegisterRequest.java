package org.example.showroom.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Chi aggiunge "ruolo" al corpo della richiesta non ottiene niente: il ruolo
// lo assegna il server (User) e questo record non ha un campo dove metterlo.
public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank String nome,
        @NotBlank String cognome
) {
}
