package net.inspironics.idme.platform.security;

import java.util.List;
import net.inspironics.idme.platform.config.IdmeProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;

/**
 * Security baseline (ADR-0005). Deny by default: only explicitly listed public endpoints are
 * reachable without a session. Authentication mechanisms arrive in Phase 1; until then every
 * non-public endpoint answers 401 with an RFC 9457 problem document.
 */
@Configuration(proxyBeanMethods = false)
class SecurityConfig {

    static final List<String> API_DOC_PATHS = List.of("/v3/api-docs", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**");

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, IdmeProperties properties, ProblemDetailSecurityHandlers handlers)
            throws Exception {
        http.authorizeHttpRequests(auth -> {
            auth.requestMatchers(HttpMethod.GET, "/api/v1/meta").permitAll();
            auth.requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/liveness", "/actuator/health/readiness").permitAll();
            auth.requestMatchers("/error").permitAll();
            if (properties.apiDocs().publicAccess()) {
                auth.requestMatchers(API_DOC_PATHS.toArray(String[]::new)).permitAll();
            }
            auth.anyRequest().authenticated();
        });

        // Server-managed sessions carried by an HttpOnly cookie; created only when a user signs in (Phase 1).
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED));

        // Cookie-to-header CSRF protection suitable for a same-site single-page application.
        http.csrf(csrf -> csrf.spa());

        http.formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .anonymous(anonymous -> {});

        http.exceptionHandling(ex -> ex
                .authenticationEntryPoint(handlers)
                .accessDeniedHandler(handlers));

        http.headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"))
                .frameOptions(frame -> frame.deny())
                .referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .permissionsPolicyHeader(permissions -> permissions.policy("camera=(), microphone=(), geolocation=(), payment=()"))
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31_536_000)));

        return http.build();
    }

    /**
     * Prevents Spring Boot from creating a default in-memory user (whose generated password would be
     * written to the log). Replaced by the identity module's account lookup in Phase 1.
     */
    @Bean
    UserDetailsService noLocalUsers() {
        return username -> {
            throw new UsernameNotFoundException("No local password users are configured");
        };
    }
}
