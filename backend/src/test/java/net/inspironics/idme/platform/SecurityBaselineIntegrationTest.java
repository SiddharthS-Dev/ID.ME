package net.inspironics.idme.platform;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import net.inspironics.idme.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Deny-by-default security baseline, problem-detail errors and response hardening headers. */
@AutoConfigureMockMvc
class SecurityBaselineIntegrationTest extends PostgresIntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void metaIsPublicAndCarriesNoSensitiveFields() throws Exception {
        mvc.perform(get("/api/v1/meta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.product").value("ID.Me"))
                .andExpect(jsonPath("$.apiVersion").value("v1"))
                .andExpect(jsonPath("$.demoDataEnabled").value(false))
                .andExpect(jsonPath("$.serverTime").isNotEmpty())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(content().string(not(containsString("jdbc"))))
                .andExpect(content().string(not(containsString("password"))));
    }

    @Test
    void responsesCarryHardeningHeaders() throws Exception {
        mvc.perform(get("/api/v1/meta"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Content-Security-Policy", containsString("frame-ancestors 'none'")))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                .andExpect(header().string("Permissions-Policy", containsString("camera=()")));
    }

    @Test
    void healthIsPublicButRevealsNoDetails() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components").doesNotExist());
    }

    @Test
    void sensitiveActuatorEndpointsAreNotExposed() throws Exception {
        mvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/configprops")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/heapdump")).andExpect(status().isUnauthorized());
    }

    @Test
    void protectedApiRequiresAuthenticationAndAnswersWithProblemDetail() throws Exception {
        mvc.perform(get("/api/v1/contacts"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.type").value(containsString("authentication-required")))
                .andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    void unauthenticatedResponsesDoNotRevealWhetherAResourceExists() throws Exception {
        String existingShape = mvc.perform(get("/api/v1/cards/00000000-0000-0000-0000-000000000001"))
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        String randomShape = mvc.perform(get("/api/v1/does-not-exist"))
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        org.assertj.core.api.Assertions.assertThat(existingShape).isEqualTo(randomShape);
    }

    @Test
    void stateChangingRequestsWithoutCsrfTokenAreRejected() throws Exception {
        mvc.perform(post("/api/v1/meta").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void noServerSessionIsCreatedForAnonymousVisitors() throws Exception {
        var protectedResult = mvc.perform(get("/api/v1/contacts")).andReturn();
        var publicResult = mvc.perform(get("/api/v1/meta")).andReturn();
        org.assertj.core.api.Assertions.assertThat(protectedResult.getRequest().getSession(false)).isNull();
        org.assertj.core.api.Assertions.assertThat(publicResult.getRequest().getSession(false)).isNull();
    }
}
