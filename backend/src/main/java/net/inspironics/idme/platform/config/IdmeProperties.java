package net.inspironics.idme.platform.config;

import jakarta.validation.constraints.NotBlank;
import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Application settings under the {@code idme.*} prefix.
 *
 * @param publicBaseUrl stable HTTPS origin used to build public card, QR and NFC URLs (ADR-0007)
 * @param environment   deployment label shown to operators (for example {@code local}, {@code staging})
 * @param apiDocs       whether the generated OpenAPI document and Swagger UI are publicly reachable
 * @param demoData      synthetic demo-data switch; must stay disabled outside demo environments
 */
@Validated
@ConfigurationProperties(prefix = "idme")
public record IdmeProperties(
        URI publicBaseUrl,
        @NotBlank String environment,
        ApiDocs apiDocs,
        DemoData demoData) {

    public IdmeProperties {
        if (publicBaseUrl == null) {
            publicBaseUrl = URI.create("http://localhost:5173");
        }
        if (apiDocs == null) {
            apiDocs = new ApiDocs(false);
        }
        if (demoData == null) {
            demoData = new DemoData(false);
        }
    }

    public record ApiDocs(boolean publicAccess) {}

    public record DemoData(boolean enabled) {}
}
