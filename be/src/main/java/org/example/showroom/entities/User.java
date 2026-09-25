package org.example.showroom.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

// Dati minimi: email e nome servono per accedere e per firmare le mail degli avvisi.
// Niente indirizzo o data di nascita, che un salone non usa (vedi Privacy Policy).
@Entity
@Table(name = "users", check = @CheckConstraint(
        name = "users_email_check",
        constraint = "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'"))
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Email
    @Column(nullable = false, unique = true)
    private String email;

    // Hash BCrypt, mai la password in chiaro
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String cognome;

    @OneToMany(mappedBy = "user")
    private List<RuoloUtente> ruoli = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
