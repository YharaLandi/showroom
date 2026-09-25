package org.example.showroom.repositories;

import org.example.showroom.entities.Avviso;
import org.example.showroom.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AvvisoRepository extends JpaRepository<Avviso, UUID> {

    // Sempre per id E proprietario: l'avviso di un altro non si trova, quindi 404
    // e non 403, cosi' nessuno scopre nemmeno che quell'avviso esiste.
    @EntityGraph(attributePaths = {"auto", "auto.marca"})
    Optional<Avviso> findByIdAndUser(UUID id, User user);

    @EntityGraph(attributePaths = {"auto", "auto.marca"})
    Page<Avviso> findByUser(User user, Pageable pageable);

    boolean existsByUserAndAutoId(User user, UUID autoId);

    Optional<Avviso> findByTokenDisattivazione(String tokenDisattivazione);

    void deleteByUser(User user);

    /**
     * Avvisi che il cambio di prezzo ha appena attraversato: prima il prezzo era
     * sopra la soglia, adesso e' uguale o sotto. Chi era gia' sotto non rientra,
     * percio' riabbassare ancora il prezzo non fa partire una seconda mail.
     */
    @EntityGraph(attributePaths = {"user", "auto", "auto.marca"})
    @Query("""
            SELECT a FROM Avviso a
            WHERE a.auto.id = :autoId
              AND a.attivo = true
              AND a.inviato = false
              AND a.soglia < :prezzoVecchio
              AND a.soglia >= :prezzoNuovo
            """)
    List<Avviso> daNotificare(@Param("autoId") UUID autoId,
                              @Param("prezzoVecchio") BigDecimal prezzoVecchio,
                              @Param("prezzoNuovo") BigDecimal prezzoNuovo);

    /**
     * Prende in un colpo solo il segno che la mail e' partita. Due modifiche
     * ravvicinate non mandano due messaggi: solo la richiesta che aggiorna
     * davvero la riga ottiene 1, le altre 0 e non spediscono niente.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Avviso a SET a.inviato = true WHERE a.id = :id AND a.inviato = false")
    int segnaInviato(@Param("id") UUID id);

    // Hash del token monouso del link di disattivazione, scritto insieme all'invio
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Avviso a SET a.tokenDisattivazione = :hash WHERE a.id = :id")
    int impostaToken(@Param("id") UUID id, @Param("hash") String hash);

    /**
     * Annulla la presa in carico quando la spedizione non e' riuscita, cosi'
     * l'avviso torna disponibile invece di restare consumato da una mail mai
     * partita. Toglie anche il token, che era stato creato per un link che
     * nessuno ha ricevuto.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Avviso a SET a.inviato = false, a.tokenDisattivazione = null WHERE a.id = :id")
    int rimettiInAttesa(@Param("id") UUID id);

}
