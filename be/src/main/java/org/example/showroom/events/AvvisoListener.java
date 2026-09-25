package org.example.showroom.events;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.showroom.config.AsyncConfig;
import org.example.showroom.services.AvvisoNotificationService;
import org.example.showroom.services.MailService;
import org.example.showroom.services.NotificaAvviso;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * Manda le mail quando un prezzo e' sceso.
 *
 * AFTER_COMMIT: si parte solo a salvataggio avvenuto. Se la transazione del
 * cambio di prezzo fallisce e torna indietro, qui non arriva niente e nessuno
 * riceve l'annuncio di un ribasso che non c'e' stato.
 *
 * @Async: la spedizione va su un thread suo, cosi' l'amministratore che ha
 * salvato non resta ad aspettare Gmail.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AvvisoListener {

    private final AvvisoNotificationService notifiche;
    private final MailService mailService;

    @Async(AsyncConfig.MAIL_EXECUTOR)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alRibasso(PrezzoRibassatoEvent evento) {
        // Senza credenziali non si spedisce: meglio lasciare gli avvisi intatti
        // che consumarli con un invio che non puo' avvenire.
        if (!mailService.attivo()) {
            log.info("Auto {}: prezzo sceso, ma l'invio mail e' disattivato (MAIL_USERNAME vuoto)", evento.autoId());
            return;
        }

        List<NotificaAvviso> daSpedire = notifiche.prendiInCarico(evento);
        if (daSpedire.isEmpty()) {
            return;
        }
        log.info("Auto {}: {} avvisi attraversati", evento.autoId(), daSpedire.size());

        for (NotificaAvviso n : daSpedire) {
            try {
                mailService.invia(n);
            } catch (RuntimeException e) {
                // Una mail che non parte non deve fermare le altre
                notifiche.rimettiInAttesa(n.avvisoId());
            }
        }
    }
}
