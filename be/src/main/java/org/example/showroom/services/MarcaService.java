package org.example.showroom.services;

import lombok.RequiredArgsConstructor;
import org.example.showroom.dto.MarcaResponse;
import org.example.showroom.dto.NuovaMarcaRequest;
import org.example.showroom.entities.Marca;
import org.example.showroom.repositories.MarcaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MarcaService {

    private final MarcaRepository marcaRepository;

    @Transactional(readOnly = true)
    public List<MarcaResponse> tutte() {
        return marcaRepository.findAll(Sort.by("nome")).stream()
                .map(MarcaResponse::of)
                .toList();
    }

    @Transactional
    public MarcaResponse crea(NuovaMarcaRequest r) {
        String nome = r.nome().trim();
        if (marcaRepository.existsByNomeIgnoreCase(nome)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Marca gia' esistente");
        }
        return MarcaResponse.of(marcaRepository.save(new Marca(nome)));
    }

    @Transactional(readOnly = true)
    public Marca trova(UUID id) {
        return marcaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Marca inesistente"));
    }
}
