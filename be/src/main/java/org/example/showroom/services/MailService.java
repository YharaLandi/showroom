package org.example.showroom.services;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mittente;

    @Value("${app.frontend.base-url}")
    private String baseUrlFrontend;

    /**
     * Senza MAIL_USERNAME non si spedisce niente.
     *
     * Chi chiama lo controlla PRIMA di prendere il segno "inviato": un avviso
     * consumato da un invio che non poteva avvenire sarebbe perso per sempre.
     */
    public boolean attivo() {
        return mittente != null && !mittente.isBlank();
    }

    public void invia(NotificaAvviso n) {
        MimeMessage messaggio = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(messaggio, "UTF-8");
            helper.setFrom(mittente);
            helper.setTo(n.email());
            helper.setSubject("Prezzo sceso: " + n.marca() + " " + n.modello());
            helper.setText(corpo(n), true);
            mailSender.send(messaggio);
            // Nei log l'avviso, mai l'indirizzo: i log di Render li legge chiunque
            // abbia accesso al progetto.
            log.info("Avviso {}: mail inviata", n.avvisoId());
        } catch (Exception e) {
            // Anche il messaggio d'errore puo' contenere l'indirizzo: si logga il tipo
            log.warn("Avviso {}: invio fallito ({})", n.avvisoId(), e.getClass().getSimpleName());
            throw new IllegalStateException("Invio non riuscito", e);
        }
    }

    // Ogni valore passa da Html.escape: nome e modello sono testo scritto da qualcuno
    private String corpo(NotificaAvviso n) {
        String link = baseUrlFrontend + "/avvisi/disattiva?token=" + n.token();
        return """
                <!doctype html>
                <html lang="it">
                <body style="font-family: system-ui, sans-serif; color: #0f172a;">
                  <p>Ciao %s,</p>
                  <p>la <strong>%s %s</strong> che stavi seguendo e' scesa a <strong>%s</strong>,
                     sotto la soglia di %s che avevi indicato.</p>
                  <p><a href="%s">Non avvisarmi piu' per questa auto</a></p>
                  <p style="color: #64748b; font-size: 12px;">
                     Ricevi questo messaggio perche' hai fissato una soglia di prezzo su ShowRoom.
                  </p>
                </body>
                </html>
                """.formatted(
                Html.escape(n.nome()),
                Html.escape(n.marca()),
                Html.escape(n.modello()),
                Html.escape(euro(n.prezzo())),
                Html.escape(euro(n.soglia())),
                Html.escape(link));
    }

    private static String euro(BigDecimal importo) {
        return NumberFormat.getCurrencyInstance(Locale.ITALY).format(importo);
    }
}
