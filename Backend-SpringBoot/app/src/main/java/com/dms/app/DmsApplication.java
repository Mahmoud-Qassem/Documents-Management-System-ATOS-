package com.dms.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.UUID;

@Configuration
@SpringBootApplication
@EnableJpaRepositories
@EnableWebSecurity
@EnableJpaAuditing(auditorAwareRef = "auditAwareImpl")
@EnableMongoAuditing(auditorAwareRef = "auditAwareImpl")
public class DmsApplication {
    public static void main(String[] args) {

        SpringApplication.run(DmsApplication.class, args);

    }
}
