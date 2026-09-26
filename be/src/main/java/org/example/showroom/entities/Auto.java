package org.example.showroom.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.Year;
import java.util.UUID;

@Entity
@Table(name = "auto", check = {
        @CheckConstraint(name = "auto_prezzo_check", constraint = "prezzo > 0"),
        @CheckConstraint(name = "auto_prezzo_acquisto_check", constraint = "prezzo_acquisto IS NULL OR prezzo_acquisto >= 0"),
        @CheckConstraint(name = "auto_chilometraggio_check", constraint = "chilometraggio >= 0"),
        @CheckConstraint(name = "auto_cilindrata_check", constraint = "cilindrata IS NULL OR cilindrata > 0"),
        @CheckConstraint(name = "auto_potenza_check", constraint = "potenza IS NULL OR potenza > 0")
})
@Getter
@Setter
@NoArgsConstructor
public class Auto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Numero di telaio: identifica l'esemplare, non il modello. Una riga = un'auto,
    // percio' qui non esistono le "copie" che in una biblioteca ha un titolo.
    @Column(nullable = false, unique = true, length = 17)
    private String telaio;

    @ManyToOne(optional = false)
    @JoinColumn(name = "marca_id", nullable = false)
    private Marca marca;

    @Column(nullable = false)
    private String modello;

    // Postgres non ha YEAR: Hibernate mappa java.time.Year su INTEGER
    @Column(name = "anno_immatricolazione", nullable = false)
    private Year annoImmatricolazione;

    @Column(nullable = false)
    private Integer chilometraggio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Alimentazione alimentazione;

    // Nullo per le elettriche: non hanno cilindri. Sulle altre e' facoltativo
    // solo per le auto create prima che il campo esistesse.
    private Integer cilindrata;

    // A differenza della cilindrata si applica a ogni alimentazione, elettriche comprese
    private Integer potenza;

    // Prezzo di vendita, l'unico che vede il pubblico
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prezzo;

    // Quanto e' costata al salone: solo per gli amministratori, mai in AutoResponse
    @Column(name = "prezzo_acquisto", precision = 10, scale = 2)
    private BigDecimal prezzoAcquisto;

    // Finisce nella pagina: si restituisce come testo, mai come HTML
    @Column(nullable = false, columnDefinition = "TEXT")
    private String descrizione;

    // Nasce sempre BOZZA. BOZZA e VENDUTA restano fuori dal catalogo pubblico.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatoAuto stato = StatoAuto.BOZZA;

    // Percorso della foto (NULL se non caricata)
    private String path;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
