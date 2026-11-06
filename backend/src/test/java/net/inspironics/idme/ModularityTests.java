package net.inspironics.idme;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModule;
import org.springframework.modulith.core.ApplicationModules;

/** Enforces the modular-monolith boundaries described in docs/architecture.md (ADR-0003). */
class ModularityTests {

    private final ApplicationModules modules = ApplicationModules.of(IdmeApplication.class);

    @Test
    void moduleBoundariesAreRespected() {
        modules.verify();
    }

    @Test
    void allPlannedModulesExist() {
        assertThat(modules.stream().map(ApplicationModule::getIdentifier).map(Object::toString))
                .contains("platform", "identity", "organizations", "cards", "sharing", "contacts", "leads",
                        "activities", "campaigns", "analytics", "notifications", "integrations", "ai", "usage",
                        "administration");
    }
}
