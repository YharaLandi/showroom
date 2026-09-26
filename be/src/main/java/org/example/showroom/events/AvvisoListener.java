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
 * Manda le mail quando un prezzo e' sceso o un'auto e' stata venduta.
 *
 * AFTER_COMMIT: si parte solo a salvataggio avvenuto. Se la transazione non va
 * a buon fine e torna indietro, qui non arriva niente e nessuno riceve
 * l'annuncio di un cambiamento che non c'e' stato.
 *
 * @Async: la spedizione va su un thread suo, cosi' l'amministratore che ha
 * salvato non resta ad aspettare Gmail.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AvvisoListener {

    private final AvvisoNotificationService avvisoNotificationService;
    private final MailService mailService;

    // Un ribasso puo' far scattare due traguardi indipendenti sullo stesso
    // avviso (fascia e soglia esatta), anche insieme se il calo e' grande:
    // vengono trattati come due liste separate, non si escludono a vicenda.
    @Async(AsyncConfig.MAIL_EXECUTOR)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alRibasso(PrezzoRibassatoEvent evento) {
        if (!mailService.attivo()) {
            log.info("Auto {}: prezzo sceso, ma l'invio mail e' disattivato (MAIL_USERNAME vuoto)", evento.autoId());
            return;
        }

        List<NotificaAvviso> perFascia = avvisoNotificationService.prendiInCaricoFascia(evento);
        List<NotificaAvviso> perSoglia = avvisoNotificationService.prendiInCarico(evento);
        if (perFascia.isEmpty() && perSoglia.isEmpty()) {
            return;
        }
        log.info("Auto {}: {} avvisi in fascia, {} avvisi a soglia esatta",
                evento.autoId(), perFascia.size(), perSoglia.size());

        spedisci(perFascia);
        spedisci(perSoglia);
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void allaVendita(AutoVendutaEvent evento) {
        if (!mailService.attivo()) {
            log.info("Auto {}: venduta, ma l'invio mail e' disattivato (MAIL_USERNAME vuoto)", evento.autoId());
            return;
        }

        List<NotificaAvviso> daSpedire = avvisoNotificationService.prendiInCaricoVendita(evento);
        if (daSpedire.isEmpty()) {
            return;
        }
        log.info("Auto {}: {} avvisi da avvisare della vendita", evento.autoId(), daSpedire.size());
        spedisci(daSpedire);
    }

    private void spedisci(List<NotificaAvviso> notificheDaSpedire) {
        for (NotificaAvviso n : notificheDaSpedire) {
            try {
                mailService.invia(n);
            } catch (RuntimeException e) {
                // Una mail che non parte non deve fermare le altre
                avvisoNotificationService.rimettiInAttesa(n.avvisoId(), n.tipo());
            }
        }
    }
}
