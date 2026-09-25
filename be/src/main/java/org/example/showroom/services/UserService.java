package org.example.showroom.services;

import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.LoginRequest;
import org.example.showroom.dto.LoginResponse;
import org.example.showroom.dto.RegisterRequest;
import org.example.showroom.dto.UserResponse;
import org.example.showroom.entities.Ruolo;
import org.example.showroom.entities.RuoloUtente;
import org.example.showroom.entities.User;
import org.example.showroom.repositories.AvvisoRepository;
import org.example.showroom.repositories.PreferitoRepository;
import org.example.showroom.repositories.RuoloRepository;
import org.example.showroom.repositories.RuoloUtenteRepository;
import org.example.showroom.repositories.TokenJwtRepository;
import org.example.showroom.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RuoloRepository ruoloRepository;
    private final RuoloUtenteRepository ruoloUtenteRepository;
    private final PreferitoRepository preferitoRepository;
    private final AvvisoRepository avvisoRepository;
    private final TokenJwtRepository tokenJwtRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        // Stesso errore per email inesistente e password errata: non riveliamo quali email sono registrate
        User user = userRepository.findByEmail(normalizzaEmail(request.username()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenziali non valide"));
        return jwtService.emetti(user, nomiRuoli(user));
    }

    // Il ruolo lo decide il server: chi si registra è sempre e solo User
    @Transactional
    public void register(RegisterRequest request) {
        String email = normalizzaEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email già registrata");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setNome(request.nome());
        user.setCognome(request.cognome());
        userRepository.save(user);

        Ruolo ruoloUser = ruoloRepository.findByRuolo(Ruolo.USER).orElseThrow();
        ruoloUtenteRepository.save(new RuoloUtente(user, ruoloUser));
    }

    @Transactional
    public LoginResponse refresh(UUID userId, String tokenAttuale) {
        User user = trovaUtente(userId);
        jwtService.revoca(tokenAttuale);
        return jwtService.emetti(user, nomiRuoli(user));
    }

    public void logout(String token) {
        jwtService.revoca(token);
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        User user = trovaUtente(userId);
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNome(),
                user.getCognome(),
                nomiRuoli(user),
                user.getCreatedAt());
    }

    /**
     * Cancella l'account e tutto quello che ne dipende.
     *
     * L'ordine non e' casuale: le righe che puntano a users vanno via per prime,
     * altrimenti il vincolo di chiave esterna blocca la cancellazione.
     *
     * Con gli avvisi spariscono le soglie, e da qui in avanti a questo indirizzo
     * non parte piu' nessuna mail: e' quello che la Privacy Policy promette.
     * I token JWT spariscono insieme, cosi' nessuna sessione rimasta aperta
     * altrove continua a valere.
     */
    @Transactional
    public void eliminaAccount(UUID userId) {
        User user = trovaUtente(userId);
        avvisoRepository.deleteByUser(user);
        preferitoRepository.deleteByUser(user);
        tokenJwtRepository.deleteByUser(user);
        ruoloUtenteRepository.deleteByUser(user);
        userRepository.delete(user);
    }

    private User trovaUtente(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }

    private List<String> nomiRuoli(User user) {
        return ruoloUtenteRepository.findByUser(user).stream()
                .map(ru -> ru.getRuolo().getRuolo())
                .toList();
    }

    private static String normalizzaEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
