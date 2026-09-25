package org.example.showroom.services;

import lombok.RequiredArgsConstructor;
import org.example.showroom.entities.Ruolo;
import org.example.showroom.entities.RuoloUtente;
import org.example.showroom.entities.User;
import org.example.showroom.repositories.RuoloRepository;
import org.example.showroom.repositories.RuoloUtenteRepository;
import org.example.showroom.repositories.TokenJwtRepository;
import org.example.showroom.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Assegna e toglie il ruolo di amministratore.
 *
 * Senza questo, l'unico amministratore sarebbe il SuperUser creato all'avvio da
 * DataInitializer, e per farne un altro bisognerebbe scrivere a mano una riga in
 * ruoli_utenti.
 */
@Service
@RequiredArgsConstructor
public class RuoloService {

    private final RuoloRepository ruoloRepository;
    private final RuoloUtenteRepository ruoloUtenteRepository;
    private final UserRepository userRepository;
    private final TokenJwtRepository tokenJwtRepository;

    @Transactional
    public void crea(String nome) {
        String ruolo = nome.trim();
        if (ruoloRepository.findByRuolo(ruolo).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ruolo gia' esistente");
        }
        ruoloRepository.save(new Ruolo(ruolo));
    }

    @Transactional
    public void grantAdmin(UUID userId) {
        User user = trovaUtente(userId);
        Ruolo admin = ruoloAdmin();
        if (ruoloUtenteRepository.existsByUserAndRuolo(user, admin)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "L'utente e' gia' Admin");
        }
        ruoloUtenteRepository.save(new RuoloUtente(user, admin));
        revocaTokenAttivi(user);
    }

    @Transactional
    public void revokeAdmin(UUID userId) {
        User user = trovaUtente(userId);
        Ruolo admin = ruoloAdmin();
        RuoloUtente ruoloUtente = ruoloUtenteRepository.findByUserAndRuolo(user, admin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "L'utente non e' Admin"));
        ruoloUtenteRepository.delete(ruoloUtente);
        revocaTokenAttivi(user);
    }

    /**
     * I ruoli stanno dentro il JWT, non si rileggono a ogni richiesta.
     *
     * Senza questa revoca, chi viene promosso resterebbe User fino alla scadenza
     * del token, e soprattutto chi viene degradato continuerebbe a comportarsi da
     * Admin per un'ora. Invalidati i token, il prossimo accesso emette un token
     * con i ruoli aggiornati.
     */
    private void revocaTokenAttivi(User user) {
        tokenJwtRepository.findByUserAndRevocatoFalse(user).forEach(t -> t.setRevocato(true));
    }

    private User trovaUtente(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
    }

    private Ruolo ruoloAdmin() {
        return ruoloRepository.findByRuolo(Ruolo.ADMIN).orElseThrow();
    }
}
