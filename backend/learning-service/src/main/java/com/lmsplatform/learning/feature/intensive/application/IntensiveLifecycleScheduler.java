package com.lmsplatform.learning.feature.intensive.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically closes intensives whose end date has passed.
 * Without this, an intensive would stay in its running status forever
 * because status is otherwise only changed manually.
 */
@Component
public class IntensiveLifecycleScheduler {
    private static final Logger log = LoggerFactory.getLogger(IntensiveLifecycleScheduler.class);

    private final IntensiveService intensives;

    public IntensiveLifecycleScheduler(IntensiveService intensives) {
        this.intensives = intensives;
    }

    @Scheduled(fixedDelayString = "${intensives.lifecycle.poll-ms:60000}", initialDelay = 15000)
    public void completeExpiredIntensives() {
        try {
            int closed = intensives.completeExpiredIntensives();
            if (closed > 0) {
                log.info("Auto-completed {} expired intensive(s)", closed);
            }
        } catch (Exception e) {
            log.warn("Failed to auto-complete expired intensives: {}", e.getMessage());
        }
    }
}
