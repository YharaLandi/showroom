package org.example.showroom.entities;

/**
 * Stato del ciclo di vita di un'auto, deciso sempre dall'amministratore.
 *
 * BOZZA e VENDUTA restano fuori dal catalogo pubblico: la prima perche' non e'
 * ancora pronta, la seconda perche' non e' piu' acquistabile. Un'auto nasce
 * sempre BOZZA; "nuovo" non e' piu' calcolato sulla data di creazione, e' una
 * scelta esplicita di chi pubblica.
 */
public enum StatoAuto {
    BOZZA,
    NUOVO,
    DISPONIBILE,
    VENDUTA
}
