package org.example.showroom;

import org.example.showroom.config.DatabaseUrl;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShowRoomApplication {

    public static void main(String[] args) {
        // Su Render le credenziali arrivano in DATABASE_URL, formato non JDBC:
        // la traduzione va fatta prima che parta il contesto Spring.
        DatabaseUrl.applicaSePresente();

        SpringApplication.run(ShowRoomApplication.class, args);
    }

}
