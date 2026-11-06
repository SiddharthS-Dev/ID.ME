package net.inspironics.idme.platform.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import net.inspironics.idme.platform.config.IdmeProperties;
import org.springframework.boot.info.BuildProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public, non-sensitive service metadata used by the web client to confirm API reachability.
 * Deliberately excludes schema versions, hostnames, dependency versions and configuration.
 */
@RestController
@RequestMapping("/api/v1/meta")
@Tag(name = "System")
class MetaController {

    private final IdmeProperties properties;
    private final Optional<BuildProperties> build;
    private final Clock clock;

    MetaController(IdmeProperties properties, ObjectProvider<BuildProperties> build, Clock clock) {
        this.properties = properties;
        this.build = Optional.ofNullable(build.getIfAvailable());
        this.clock = clock;
    }

    @GetMapping
    @Operation(summary = "Service metadata", description = "Public. Returns product name, API version, build version and server time (UTC).")
    ResponseEntity<MetaResponse> meta() {
        var body = new MetaResponse(
                "ID.Me",
                "v1",
                build.map(BuildProperties::getVersion).orElse("development"),
                properties.environment(),
                properties.demoData().enabled(),
                Instant.now(clock));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
    }

    record MetaResponse(
            String product,
            String apiVersion,
            String buildVersion,
            String environment,
            boolean demoDataEnabled,
            Instant serverTime) {}
}
