package org.example.showroom.services;

import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.*;
import org.example.showroom.entities.Auto;
import org.example.showroom.events.PrezzoRibassatoEvent;
import org.example.showroom.repositories.AutoRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
            "createdAt", "createdAt");
    private static final Sort SORT_PREDEFINITO = Sort.by(Sort.Direction.DESC, "createdAt");

    private final AutoRepository autoRepository;
    private final MarcaService marcaService;
    private final ApplicationEventPublisher eventi;

    // ---------- lettura pubblica ----------

    @Transactional(readOnly = true)
    public PageResponse<AutoResponse> catalogo(AutoSearchParams params, Pageable pageable) {
        return PageResponse.of(cerca(params, pageable, true).map(AutoResponse::of));
    }

    // Le bozze non sono in catalogo e non hanno nemmeno una pagina di dettaglio:
    // chi ne indovina l'id riceve 404 come per un'auto che non esiste.
    @Transactional(readOnly = true)
    public AutoResponse dettaglio(UUID id) {
        Auto auto = trova(id);
        if (auto.isBozza()) {
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
        auto.setPrezzo(r.prezzo());
        auto.setPrezzoAcquisto(r.prezzoAcquisto());
        auto.setDescrizione(r.descrizione().trim());
        auto.setPath(r.path());
        // Nasce come bozza: si pubblica con una modifica esplicita
        auto.setBozza(true);
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
        if (r.prezzoAcquisto() != null) auto.setPrezzoAcquisto(r.prezzoAcquisto());
        if (r.descrizione() != null) auto.setDescrizione(r.descrizione().trim());
        if (r.bozza() != null) auto.setBozza(r.bozza());
        if (r.path() != null) auto.setPath(r.path());

        return AutoAdminResponse.of(auto);
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
