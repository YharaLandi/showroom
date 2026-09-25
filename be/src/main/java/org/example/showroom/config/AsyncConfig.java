package org.example.showroom.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Esecutore dedicato alle mail degli avvisi.
 *
 * Serve perche' l'amministratore che salva un prezzo non deve restare ad
 * aspettare Gmail: la richiesta HTTP si chiude subito e la spedizione prosegue
 * qui, su un thread suo.
 *
 * Coda limitata e CallerRunsPolicy: se arrivassero piu' ribassi di quanti se ne
 * riescono a spedire, la coda non cresce senza fine fino a esaurire la memoria,
 * ma rallenta chi produce il lavoro.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    public static final String MAIL_EXECUTOR = "mailExecutor";

    @Bean(MAIL_EXECUTOR)
    public Executor mailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("avvisi-mail-");
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        // Allo spegnimento si aspetta che le mail in corso finiscano
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
