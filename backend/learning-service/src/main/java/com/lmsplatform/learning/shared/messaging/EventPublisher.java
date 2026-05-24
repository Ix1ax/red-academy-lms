package com.lmsplatform.learning.shared.messaging;

import com.lmsplatform.learning.config.RabbitConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventPublisher {
    private final RabbitTemplate rabbit;

    public EventPublisher(RabbitTemplate rabbit) {
        this.rabbit = rabbit;
    }

    public void publish(String routingKey, Object payload) {
        rabbit.convertAndSend(RabbitConfig.LMS_EVENTS_EXCHANGE, routingKey, payload);
    }
}
