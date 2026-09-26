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
     * Avvisi che il cambio di prezzo ha appena fatto entrare nella fascia di
     * mille della loro soglia: soglia 4500 -> fascia 4000-4999, il traguardo e'
     * "il prezzo scende sotto 5000". Indipendente dalla soglia esatta: i due
     * traguardi si notificano separatamente, anche se ravvicinati.
     *
     * FLOOR(soglia / 1000) * 1000 + 1000 e' il tetto della fascia (5000 per
     * soglia 4500 o 4000): la stessa identica logica di attraversamento di
     * daNotificare, applicata a un valore calcolato invece che a "soglia".
     */
    @EntityGraph(attributePaths = {"user", "auto", "auto.marca"})
    @Query("""
            SELECT a FROM Avviso a
            WHERE a.auto.id = :autoId
              AND a.attivo = true
              AND a.fasciaInviata = false
              AND (FLOOR(a.soglia / 1000) * 1000 + 1000) < :prezzoVecchio
              AND (FLOOR(a.soglia / 1000) * 1000 + 1000) >= :prezzoNuovo
            """)
    List<Avviso> daNotificarePerFascia(@Param("autoId") UUID autoId,
                                       @Param("prezzoVecchio") BigDecimal prezzoVecchio,
                                       @Param("prezzoNuovo") BigDecimal prezzoNuovo);

    // Tutti gli avvisi attivi non ancora avvisati della vendita: qui non c'e'
    // un attraversamento da verificare, la vendita e' un evento singolo.
    @EntityGraph(attributePaths = {"user", "auto", "auto.marca"})
    @Query("SELECT a FROM Avviso a WHERE a.auto.id = :autoId AND a.attivo = true AND a.vendutaInviata = false")
    List<Avviso> daNotificarePerVendita(@Param("autoId") UUID autoId);

    /**
     * Prende in un colpo solo il segno che la mail e' partita. Due modifiche
     * ravvicinate non mandano due messaggi: solo la richiesta che aggiorna
     * davvero la riga ottiene 1, le altre 0 e non spediscono niente.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Avviso a SET a.inviato = true WHERE a.id = :id AND a.inviato = false")
    int segnaInviato(@Param("id") UUID id);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Avviso a SET a.fasciaInviata = true WHERE a.id = :id AND a.fasciaInviata = false")
    int segnaFasciaInviata(@Param("id") UUID id);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Avviso a SET a.vendutaInviata = true WHERE a.id = :id AND a.vendutaInviata = false")
    int segnaVendutaInviata(@Param("id") UUID id);

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

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Avviso a SET a.fasciaInviata = false, a.tokenDisattivazione = null WHERE a.id = :id")
    int rimettiFasciaInAttesa(@Param("id") UUID id);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Avviso a SET a.vendutaInviata = false, a.tokenDisattivazione = null WHERE a.id = :id")
    int rimettiVendutaInAttesa(@Param("id") UUID id);

}
