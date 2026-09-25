package org.example.showroom.services;

/**
 * Escape dei valori inseriti nel template HTML della mail.
 *
 * Nel messaggio finiscono il nome dell'utente e il modello dell'auto, che sono
 * testo scritto da qualcuno: senza escape, un nome come
 * &lt;script&gt;... o un apice che chiude un attributo cambierebbero la struttura
 * della pagina che il destinatario apre nel client di posta.
 *
 * Ogni valore che entra nel template passa da qui, senza eccezioni.
 */
final class Html {

    private Html() {
    }

    static String escape(String testo) {
        if (testo == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(testo.length() + 16);
        for (int i = 0; i < testo.length(); i++) {
            char c = testo.charAt(i);
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&#39;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }
}
