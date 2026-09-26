package org.example.showroom.services;

import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.*;
import org.example.showroom.entities.Auto;
import org.example.showroom.entities.StatoAuto;
import org.example.showroom.events.AutoVendutaEvent;
import org.example.showroom.events.PrezzoRibassatoEvent;
import org.example.showroom.repositories.AutoRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Year;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AutoService {

    // Colonne ordinabili: nome nel parametro sort -> proprieta' JPA.
    // Quello che non e' qui dentro non e' ordinabile e produce 400.
    private static final Map<String, String> SORT_CONSENTITI = Map.of(
            "prezzo", "prezzo",
            "modello", "modello",
            "marca", "marca.nome",
            "annoImmatricolazione", "annoImmatricolazione",
            "chilometraggio", "chilometraggio",
            "alimentazione", "alimentazione",
            "potenza", "potenza",
            "createdAt", "createdAt");
    private static final Sort SORT_PREDEFINITO = Sort.by(Sort.Direction.DESC, "createdAt");

    private static final long FOTO_DIMENSIONE_MASSIMA = 30L * 1024 * 1024;

    private final AutoRepository autoRepository;
    private final MarcaService marcaService;
    private final ApplicationEventPublisher eventi;

    // ---------- lettura pubblica ----------

    @Transactional(readOnly = true)
    public PageResponse<AutoResponse> catalogo(AutoSearchParams params, Pageable pageable) {
        return PageResponse.of(cerca(params, pageable, true).map(AutoResponse::of));
    }

    // Bozze e venduti non sono in catalogo e non hanno nemmeno una pagina di
    // dettaglio: chi ne indovina l'id riceve 404 come per un'auto che non esiste.
    @Transactional(readOnly = true)
    public AutoResponse dettaglio(UUID id) {
        Auto auto = trova(id);
        if (!pubblica(auto)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Auto non trovata");
        }
        return AutoResponse.of(auto);
    }

    // ---------- lettura amministrativa ----------

    @Transactional(readOnly = true)
    public PageResponse<AutoAdminResponse> catalogoAdmin(AutoSearchParams params, Pageable pageable) {
        return PageResponse.of(cerca(params, pageable, false).map(AutoAdminResponse::of));
    }

    @Transactional(readOnly = true)
    public AutoAdminResponse dettaglioAdmin(UUID id) {
        return AutoAdminResponse.of(trova(id));
    }

    // ---------- scrittura ----------

    @Transactional
    public AutoAdminResponse crea(NuovaAutoRequest r) {
        verificaAnno(r.annoImmatricolazione());
        String telaio = r.telaio().trim().toUpperCase();
        if (autoRepository.existsByTelaioIgnoreCase(telaio)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Telaio gia' presente in catalogo");
        }

        Auto auto = new Auto();
        auto.setTelaio(telaio);
        auto.setMarca(marcaService.trova(r.marcaId()));
        auto.setModello(r.modello().trim());
        auto.setAnnoImmatricolazione(Year.of(r.annoImmatricolazione()));
        auto.setChilometraggio(r.chilometraggio());
        auto.setAlimentazione(r.alimentazione());
        auto.setCilindrata(r.cilindrata());
        auto.setPotenza(r.potenza());
        auto.setPrezzo(r.prezzo());
        auto.setPrezzoAcquisto(r.prezzoAcquisto());
        auto.setDescrizione(r.descrizione().trim());
        // Nasce sempre BOZZA: si pubblica con una modifica esplicita dello stato
        auto.setStato(StatoAuto.BOZZA);
        autoRepository.save(auto);

        return AutoAdminResponse.of(auto);
    }

    @Transactional
    public AutoAdminResponse modifica(UUID id, ModificaAutoRequest r) {
        Auto auto = trova(id);

        if (r.marcaId() != null) auto.setMarca(marcaService.trova(r.marcaId()));
        if (r.modello() != null) auto.setModello(r.modello().trim());
        if (r.annoImmatricolazione() != null) {
            verificaAnno(r.annoImmatricolazione());
            auto.setAnnoImmatricolazione(Year.of(r.annoImmatricolazione()));
        }
        if (r.chilometraggio() != null) auto.setChilometraggio(r.chilometraggio());
        if (r.alimentazione() != null) auto.setAlimentazione(r.alimentazione());
        if (r.cilindrata() != null) auto.setCilindrata(r.cilindrata());
        if (r.potenza() != null) auto.setPotenza(r.potenza());
        if (r.prezzoAcquisto() != null) auto.setPrezzoAcquisto(r.prezzoAcquisto());
        if (r.descrizione() != null) auto.setDescrizione(r.descrizione().trim());
        if (r.stato() != null) {
            // Solo se e' una transizione vera: risegnare come venduta un'auto
            // gia' venduta non deve avvisare una seconda volta chi la seguiva.
            boolean diventaVenduta = r.stato() == StatoAuto.VENDUTA && auto.getStato() != StatoAuto.VENDUTA;
            auto.setStato(r.stato());
            if (diventaVenduta) {
                eventi.publishEvent(new AutoVendutaEvent(auto.getId()));
            }
        }

        return AutoAdminResponse.of(auto);
    }

    /**
     * Il formato si riconosce dai byte veri del file (magic number), non dal
     * Content-Type dichiarato dal client: quello lo decide il browser che ha
     * inviato la richiesta, e si puo' falsificare banalmente.
     */
    @Transactional
    public AutoAdminResponse caricaFoto(UUID id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File mancante o vuoto");
        }
        if (file.getSize() > FOTO_DIMENSIONE_MASSIMA) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Il file supera i 30MB");
        }
        byte[] contenuto;
        try {
            contenuto = file.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File non leggibile");
        }
        String tipo = tipoImmagine(contenuto);
        if (tipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato non supportato: solo PNG, JPEG o WEBP");
        }

        Auto auto = trova(id);
        auto.setFoto(contenuto);
        auto.setFotoContentType(tipo);
        return AutoAdminResponse.of(auto);
    }

    @Transactional(readOnly = true)
    public FotoAuto foto(UUID id) {
        Auto auto = trova(id);
        if (auto.getFoto() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Foto non caricata");
        }
        return new FotoAuto(auto.getFoto(), auto.getFotoContentType());
    }

    private static String tipoImmagine(byte[] b) {
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "image/png";
        }
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    /**
     * Cambia il prezzo di vendita e, se e' sceso, annuncia il ribasso.
     *
     * L'evento dice soltanto che il prezzo e' calato: a stabilire quali avvisi
     * hanno attraversato la soglia ci pensa chi lo ascolta, dopo il commit.
     * Salvare di nuovo lo stesso prezzo non annuncia niente.
     */
    @Transactional
    public AutoAdminResponse cambiaPrezzo(UUID id, CambioPrezzoRequest r) {
        Auto auto = trova(id);
        BigDecimal vecchio = auto.getPrezzo();
        BigDecimal nuovo = r.prezzo();

        if (nuovo.compareTo(vecchio) < 0) {
            auto.setPrezzo(nuovo);
            eventi.publishEvent(new PrezzoRibassatoEvent(auto.getId(), vecchio, nuovo));
        } else {
            auto.setPrezzo(nuovo);
        }
        return AutoAdminResponse.of(auto);
    }

    // ---------- interni ----------

    Auto trova(UUID id) {
        return autoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Auto non trovata"));
    }

    // Usato anche da PreferitoService e AvvisoService: una bozza non e' ancora in
    // vendita, una venduta non lo e' piu'. Ne' l'una ne' l'altra vanno tra i
    // preferiti o gli avvisi di prezzo.
    boolean pubblica(Auto auto) {
        return auto.getStato() == StatoAuto.NUOVO || auto.getStato() == StatoAuto.DISPONIBILE;
    }

    private org.springframework.data.domain.Page<Auto> cerca(AutoSearchParams params, Pageable pageable, boolean soloPubblicate) {
        Sort sort = SearchUtils.traduciSort(pageable.getSort(), SORT_CONSENTITI, SORT_PREDEFINITO);
        Pageable richiesta = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        return autoRepository.findAll(AutoSpecifications.da(params, soloPubblicate), richiesta);
    }

    private static void verificaAnno(int anno) {
        if (anno > Year.now().getValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "annoImmatricolazione non puo' essere nel futuro");
        }
    }
}
