package net.inspironics.idme;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * ID.Me modular monolith entry point.
 *
 * <p>Each direct sub-package is an application module (see docs/architecture.md). {@code platform}
 * is the shared kernel: cross-cutting security, web, audit and configuration concerns.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class IdmeApplication {

    public static void main(String[] args) {
        SpringApplication.run(IdmeApplication.class, args);
    }
}
