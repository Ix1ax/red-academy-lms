package com.lmsplatform.communication.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    public static final String LMS_EVENTS_EXCHANGE = "lms.events";
    public static final String NOTIFICATIONS_QUEUE = "lms.notifications";

    @Bean
    TopicExchange lmsEventsExchange() {
        return new TopicExchange(LMS_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    org.springframework.amqp.core.Queue notificationsQueue() {
        return new org.springframework.amqp.core.Queue(NOTIFICATIONS_QUEUE, true);
    }

    @Bean
    Binding notificationsBinding(TopicExchange lmsEventsExchange, org.springframework.amqp.core.Queue notificationsQueue) {
        return BindingBuilder.bind(notificationsQueue).to(lmsEventsExchange).with("#");
    }

    @Bean
    MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
