package org.example.showroom.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Lega un utente a un'auto con una soglia di prezzo.
 *
 * "inviato" e' il segno che la mail e' gia' partita: si alza una volta sola e non
 * torna mai indietro, percio' se il prezzo risale e poi riscende non parte un
 * secondo messaggio.
 */
@Entity
@Table(name = "avvisi",
        uniqueConstraints = @UniqueConstraint(name = "avvisi_unique", columnNames = {"user_id", "auto_id"}),
        check = @CheckConstraint(name = "avvisi_soglia_check", constraint = "soglia > 0"))
@Getter
@Setter
@NoArgsConstructor
public class Avviso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "auto_id", nullable = false)
    private Auto auto;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal soglia;

    @Column(nullable = false)
    private boolean inviato = false;

    // false dopo che l'utente ha usato il link di disattivazione della mail
    @Column(nullable = false)
    private boolean attivo = true;

    // Hash del token monouso del link "non avvisarmi piu'": come per i JWT, a DB
    // non finisce il valore che gira nella mail.
    @Column(name = "token_disattivazione", unique = true)
    private String tokenDisattivazione;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Avviso(User user, Auto auto, BigDecimal soglia) {
        this.user = user;
        this.auto = auto;
        this.soglia = soglia;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
