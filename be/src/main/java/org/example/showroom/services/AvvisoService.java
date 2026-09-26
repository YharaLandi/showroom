package org.example.showroom.services;

import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.AvvisoResponse;
import org.example.showroom.dto.ModificaAvvisoRequest;
import org.example.showroom.dto.NuovoAvvisoRequest;
import org.example.showroom.dto.PageResponse;
import org.example.showroom.entities.Auto;
import org.example.showroom.entities.Avviso;
import org.example.showroom.entities.User;
import org.example.showroom.repositories.AvvisoRepository;
import org.example.showroom.repositories.UserRepository;
import org.example.showroom.security.TokenHasher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvvisoService {

    private final AvvisoRepository avvisoRepository;
    private final UserRepository userRepository;
    private final AutoService autoService;

    @Transactional(readOnly = true)
    public PageResponse<AvvisoResponse> miei(UUID userId, Pageable pageable) {
        Pageable recenti = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.of(avvisoRepository.findByUser(utente(userId), recenti).map(AvvisoResponse::of));
    }

    @Transactional(readOnly = true)
    public AvvisoResponse dettaglio(UUID userId, UUID avvisoId) {
        return AvvisoResponse.of(trovaDiProprieta(userId, avvisoId));
    }

    @Transactional
    public AvvisoResponse crea(UUID userId, NuovoAvvisoRequest r) {
        User user = utente(userId);
        Auto auto = autoService.trova(r.autoId());
        // Bozza o venduta: non e' in catalogo, non la si puo' seguire con un avviso
        if (!autoService.pubblica(auto)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Auto non trovata");
        }
        if (avvisoRepository.existsByUserAndAutoId(user, auto.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esiste gia' un avviso per questa auto");
        }
        try {
            // saveAndFlush: il vincolo unico deve scattare qui dentro, non al commit
            return AvvisoResponse.of(avvisoRepository.saveAndFlush(new Avviso(user, auto, r.soglia())));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esiste gia' un avviso per questa auto");
        }
    }

    /**
     * Cambiare la soglia rimette l'avviso in attesa, sia per il traguardo esatto
     * che per la fascia (che dipende dalla soglia: cambiandola, cambia anche la
     * fascia di riferimento). "vendutaInviata" invece non si tocca: non dipende
     * dal prezzo scelto dall'utente, dipende solo dall'auto essere stata venduta.
     *
     * Chi ha gia' ricevuto la mail a 15.000 e scende a 12.000 sta chiedendo
     * un'altra cosa, e va avvisato di nuovo quando il prezzo arrivera' li'.
     */
    @Transactional
    public AvvisoResponse modifica(UUID userId, UUID avvisoId, ModificaAvvisoRequest r) {
        Avviso avviso = trovaDiProprieta(userId, avvisoId);
        avviso.setSoglia(r.soglia());
        avviso.setInviato(false);
        avviso.setFasciaInviata(false);
        avviso.setAttivo(true);
        avviso.setTokenDisattivazione(null);
        return AvvisoResponse.of(avviso);
    }

    @Transactional
    public void elimina(UUID userId, UUID avvisoId) {
        avvisoRepository.delete(trovaDiProprieta(userId, avvisoId));
    }

    /**
     * Disattivazione dal link della mail: il token e' casuale e vale una volta sola.
     *
     * Non serve essere collegati, percio' l'unica difesa e' che il token sia
     * impossibile da indovinare: per questo nel link non c'e' l'id dell'avviso.
     * Dopo l'uso viene cancellato e lo stesso link non funziona piu'.
     */
    @Transactional
    public void disattivaConToken(String token) {
        Avviso avviso = avvisoRepository.findByTokenDisattivazione(TokenHasher.sha256(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Link non valido o gia' usato"));
        avviso.setAttivo(false);
        avviso.setTokenDisattivazione(null);
    }

    // Per id E proprietario: l'avviso di un altro da' 404, non 403, cosi' non si
    // scopre nemmeno che esiste.
    private Avviso trovaDiProprieta(UUID userId, UUID avvisoId) {
        return avvisoRepository.findByIdAndUser(avvisoId, utente(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avviso non trovato"));
    }

    private User utente(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }
}
