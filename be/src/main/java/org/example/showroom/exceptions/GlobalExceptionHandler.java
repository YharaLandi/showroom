package org.example.showroom.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Senza questo il "reason" passato a ogni ResponseStatusException dei service
    // (es. "annoImmatricolazione non puo' essere nel futuro", "Formato non
    // supportato...") non arriva mai al frontend: Spring per default non include
    // il messaggio nella risposta di errore, e resta solo "400 Bad Request".
    // Handler specifico invece di server.error.include-message=always: quella
    // proprieta' varrebbe per QUALSIASI eccezione non gestita, compresi eventuali
    // bug imprevisti che potrebbero rivelare dettagli interni (es. del database).
    // Qui il messaggio e' sempre uno scritto a mano apposta per essere letto.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        HttpStatusCode stato = ex.getStatusCode();
        return ResponseEntity.status(stato).body(Map.of("status", stato.value(), "message", ex.getReason()));
    }

    // 400 con l'elenco dei campi non validi: { "errors": { "email": "...", ... } }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return Map.of("status", 400, "errors", errors);
    }

    // Scatta prima ancora di entrare nel controller se il file supera
    // spring.servlet.multipart.max-file-size: senza questo Spring risponderebbe
    // con un generico 500.
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public Map<String, Object> handleMaxUpload(MaxUploadSizeExceededException ex) {
        return Map.of("status", 413, "message", "Il file supera i 30MB");
    }
}
