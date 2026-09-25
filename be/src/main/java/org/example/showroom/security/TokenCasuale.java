package org.example.showroom.security;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Token del link "non avvisarmi piu'".
 *
 * Nel link non puo' esserci l'id dell'avviso: gli id sono sequenziali da
 * indovinare o comunque enumerabili, e chiunque potrebbe spegnere gli avvisi
 * altrui. Qui ci sono 32 byte da SecureRandom, che non si tirano a indovinare.
 *
 * A DB finisce solo l'hash (vedi TokenHasher): chi legge la tabella non ricava
 * link funzionanti.
 */
public final class TokenCasuale {

    private static final SecureRandom RANDOM = new SecureRandom();

    private TokenCasuale() {
    }

    public static String genera() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        // URL-safe: il token viaggia nella query string del link
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
