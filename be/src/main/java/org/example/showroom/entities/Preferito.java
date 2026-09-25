package org.example.showroom.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

// Un utente non puo' aggiungere due volte la stessa auto: lo impedisce il DB,
// non un controllo applicativo che due richieste simultanee aggirerebbero.
@Entity
@Table(name = "preferiti",
        uniqueConstraints = @UniqueConstraint(name = "preferiti_unique", columnNames = {"user_id", "auto_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Preferito {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "auto_id", nullable = false)
    private Auto auto;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Preferito(User user, Auto auto) {
        this.user = user;
        this.auto = auto;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
