package com.lmsplatform.organization.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    public static final String LMS_EVENTS_EXCHANGE = "lms.events";

    @Bean
    TopicExchange lmsEventsExchange() {
        return new TopicExchange(LMS_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
