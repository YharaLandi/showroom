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
 * Un avviso ha tre traguardi indipendenti, ciascuno con il suo segno "gia'
 * inviato": la fascia di mille che contiene la soglia (es. soglia 4500 ->
 * fascia 4000-4999, notifica appena il prezzo scende sotto 5000), la soglia
 * esatta, e la vendita dell'auto. Ogni segno si alza una volta sola e non
 * torna mai indietro, percio' oscillazioni successive non duplicano la mail.
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

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean inviato = false;

    // Fascia di mille che contiene la soglia: notifica anticipata, indipendente
    // dalla soglia esatta. Calcolata al volo da "soglia", non salvata a parte.
    @Column(name = "fascia_inviata", nullable = false, columnDefinition = "boolean default false")
    private boolean fasciaInviata = false;

    // L'auto seguita e' stata segnata come venduta
    @Column(name = "venduta_inviata", nullable = false, columnDefinition = "boolean default false")
    private boolean vendutaInviata = false;

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
