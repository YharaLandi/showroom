package org.example.showroom.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.showroom.entities.Avviso;
import org.example.showroom.events.AutoVendutaEvent;
import org.example.showroom.events.PrezzoRibassatoEvent;
import org.example.showroom.repositories.AvvisoRepository;
import org.example.showroom.security.TokenCasuale;
import org.example.showroom.security.TokenHasher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

/**
 * Lavoro a database della notifica, separato da chi spedisce.
 *
 * I metodi sono chiamati dall'ascoltatore, che sta in un'altra classe: se si
 * chiamassero fra loro dentro questo bean, @Transactional non verrebbe applicato
 * e ogni UPDATE finirebbe fuori transazione.
 *
 * REQUIRES_NEW perche' qui siamo dopo il commit del cambio di prezzo (o della
 * vendita), su un thread diverso: non c'e' nessuna transazione da riusare.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AvvisoNotificationService {

    private final AvvisoRepository avvisoRepository;

    /**
     * Prende in carico gli avvisi che il ribasso ha fatto raggiungere la soglia
     * esatta e restituisce quelli da spedire davvero.
     *
     * Il segno si prende con un solo UPDATE condizionato: fra due modifiche di
     * prezzo ravvicinate, solo la richiesta che aggiorna davvero la riga ottiene
     * 1 e spedisce. L'altra ottiene 0 e si ferma, senza che serva un lock.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<NotificaAvviso> prendiInCarico(PrezzoRibassatoEvent e) {
        List<Avviso> candidati = avvisoRepository.daNotificare(e.autoId(), e.prezzoVecchio(), e.prezzoNuovo());
        return prendi(candidati, TipoNotifica.SOGLIA, avvisoRepository::segnaInviato, Avviso::getSoglia);
    }

    /**
     * Prende in carico gli avvisi che il ribasso ha fatto entrare nella fascia
     * di mille della loro soglia: indipendente dalla soglia esatta, vedi
     * AvvisoRepository.daNotificarePerFascia.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<NotificaAvviso> prendiInCaricoFascia(PrezzoRibassatoEvent e) {
        List<Avviso> candidati = avvisoRepository.daNotificarePerFascia(e.autoId(), e.prezzoVecchio(), e.prezzoNuovo());
        return prendi(candidati, TipoNotifica.FASCIA, avvisoRepository::segnaFasciaInviata, Avviso::getSoglia);
    }

    // La vendita non ha una soglia da riportare nella mail
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<NotificaAvviso> prendiInCaricoVendita(AutoVendutaEvent e) {
        List<Avviso> candidati = avvisoRepository.daNotificarePerVendita(e.autoId());
        return prendi(candidati, TipoNotifica.VENDUTA, avvisoRepository::segnaVendutaInviata, a -> null);
    }

    private List<NotificaAvviso> prendi(List<Avviso> candidati, TipoNotifica tipo,
                                        Function<UUID, Integer> segna, Function<Avviso, BigDecimal> soglia) {
        List<NotificaAvviso> presi = new ArrayList<>();
        for (Avviso a : candidati) {
            // I valori si leggono adesso: l'UPDATE di "segna" svuota il contesto di
            // persistenza e da quel momento l'entita' non e' piu' navigabile.
            UUID id = a.getId();
            String email = a.getUser().getEmail();
            String nome = a.getUser().getNome();
            String marca = a.getAuto().getMarca().getNome();
            String modello = a.getAuto().getModello();
            var prezzo = a.getAuto().getPrezzo();
            var sogliaValore = soglia.apply(a);

            if (segna.apply(id) != 1) {
                // Qualcun altro l'ha gia' preso: non si spedisce un secondo messaggio
                continue;
            }

            String token = TokenCasuale.genera();
            avvisoRepository.impostaToken(id, TokenHasher.sha256(token));

            presi.add(new NotificaAvviso(id, tipo, email, nome, marca, modello, prezzo, sogliaValore, token));
        }
        return presi;
    }

    /**
     * Gmail non ha risposto: l'avviso torna da inviare.
     *
     * Fra perdere la mail e rischiare un doppione si e' scelto il doppione. Una
     * soglia di prezzo serve a non lasciarsi sfuggire l'occasione: un avviso
     * consumato da un invio fallito non avviserebbe mai piu' nessuno, in
     * silenzio. Il doppione invece capita solo se Gmail ha accettato il
     * messaggio ma ha risposto con un errore, ed e' un fastidio, non un danno.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void rimettiInAttesa(UUID avvisoId, TipoNotifica tipo) {
        switch (tipo) {
            case SOGLIA -> avvisoRepository.rimettiInAttesa(avvisoId);
            case FASCIA -> avvisoRepository.rimettiFasciaInAttesa(avvisoId);
            case VENDUTA -> avvisoRepository.rimettiVendutaInAttesa(avvisoId);
        }
        log.warn("Avviso {}: rimesso in attesa dopo un invio fallito ({})", avvisoId, tipo);
    }
}
