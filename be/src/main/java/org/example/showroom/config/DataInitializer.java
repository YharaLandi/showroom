package org.example.showroom.config;

import lombok.RequiredArgsConstructor;
import org.example.showroom.entities.Ruolo;
import org.example.showroom.entities.RuoloUtente;
import org.example.showroom.entities.User;
import org.example.showroom.repositories.RuoloRepository;
import org.example.showroom.repositories.RuoloUtenteRepository;
import org.example.showroom.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Crea ruoli e SuperUser se non esistono (idempotente: non sovrascrive valori modificati)
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final RuoloRepository ruoloRepository;
    private final UserRepository userRepository;
    private final RuoloUtenteRepository ruoloUtenteRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.superuser.email}")
    private String superUserEmail;

    @Value("${app.superuser.password}")
    private String superUserPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List.of(Ruolo.SUPER_USER, Ruolo.ADMIN, Ruolo.USER).forEach(nome ->
                ruoloRepository.findByRuolo(nome)
                        .orElseGet(() -> ruoloRepository.save(new Ruolo(nome))));

        if (userRepository.findByEmail(superUserEmail).isEmpty()) {
            User superUser = new User();
            superUser.setEmail(superUserEmail);
            superUser.setPassword(passwordEncoder.encode(superUserPassword));
            superUser.setNome("Super");
            superUser.setCognome("User");
            userRepository.save(superUser);

            Ruolo ruoloSuperUser = ruoloRepository.findByRuolo(Ruolo.SUPER_USER).orElseThrow();
            ruoloUtenteRepository.save(new RuoloUtente(superUser, ruoloSuperUser));
        }
    }
}
