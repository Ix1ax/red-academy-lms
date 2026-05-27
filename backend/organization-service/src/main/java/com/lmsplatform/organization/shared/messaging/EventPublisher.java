package com.lmsplatform.organization.shared.messaging;

import com.lmsplatform.organization.config.RabbitConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class EventPublisher {
    private final RabbitTemplate rabbit;

    public EventPublisher(RabbitTemplate rabbit) {
        this.rabbit = rabbit;
    }

    public void publish(String routingKey, Object payload) {
        rabbit.convertAndSend(RabbitConfig.LMS_EVENTS_EXCHANGE, routingKey, enrich(routingKey, payload));
    }

    private Object enrich(String routingKey, Object payload) {
        if (payload instanceof Map<?, ?> map) {
            var enriched = new LinkedHashMap<String, Object>();
            map.forEach((key, value) -> enriched.put(String.valueOf(key), value));
            enriched.putIfAbsent("eventType", routingKey);
            return enriched;
        }
        return Map.of("eventType", routingKey, "payload", payload == null ? "" : payload);
    }
}
