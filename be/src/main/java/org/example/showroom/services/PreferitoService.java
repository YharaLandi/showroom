package org.example.showroom.services;

import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.NuovoPreferitoRequest;
import org.example.showroom.dto.PageResponse;
import org.example.showroom.dto.PreferitoResponse;
import org.example.showroom.entities.Auto;
import org.example.showroom.entities.Preferito;
import org.example.showroom.entities.User;
import org.example.showroom.repositories.PreferitoRepository;
import org.example.showroom.repositories.UserRepository;
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
public class PreferitoService {

    private final PreferitoRepository preferitoRepository;
    private final UserRepository userRepository;
    private final AutoService autoService;

    @Transactional(readOnly = true)
    public PageResponse<PreferitoResponse> miei(UUID userId, Pageable pageable) {
        Pageable recenti = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.of(preferitoRepository.findByUser(utente(userId), recenti).map(PreferitoResponse::of));
    }

    @Transactional
    public PreferitoResponse aggiungi(UUID userId, NuovoPreferitoRequest r) {
        User user = utente(userId);
        Auto auto = autoService.trova(r.autoId());
        // Una bozza non e' in catalogo: non la si puo' mettere tra i preferiti
        if (auto.isBozza()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Auto non trovata");
        }
        if (preferitoRepository.existsByUserAndAutoId(user, auto.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Auto gia' tra i preferiti");
        }
        try {
            // saveAndFlush, non save: la scrittura deve arrivare al DB adesso, altrimenti
            // il vincolo unico scatterebbe al commit, fuori da questo try, e uscirebbe un 500.
            return PreferitoResponse.of(preferitoRepository.saveAndFlush(new Preferito(user, auto)));
        } catch (DataIntegrityViolationException e) {
            // Due richieste simultanee hanno superato entrambe il controllo sopra:
            // qui a fermare il doppione e' il vincolo unico del DB.
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Auto gia' tra i preferiti");
        }
    }

    // Cercato per id E proprietario: il preferito di un altro semplicemente non si trova
    @Transactional
    public void rimuovi(UUID userId, UUID preferitoId) {
        Preferito preferito = preferitoRepository.findByIdAndUser(preferitoId, utente(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Preferito non trovato"));
        preferitoRepository.delete(preferito);
    }

    private User utente(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }
}
