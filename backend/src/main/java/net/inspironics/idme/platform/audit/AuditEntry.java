package net.inspironics.idme.platform.audit;

import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * One audit event. {@code action} uses dotted lower-case names such as {@code card.published}.
 *
 * @param tenantId   owning tenant, or {@code null} for platform-level events
 * @param actorId    acting user or integration, or {@code null} for anonymous/system actors
 * @param details    small, non-sensitive structured context (no secrets or private contact data)
 */
public record AuditEntry(
        UUID tenantId,
        ActorType actorType,
        UUID actorId,
        String action,
        String targetType,
        String targetId,
        Outcome outcome,
        String traceId,
        Map<String, Object> details) {

    private static final Pattern ACTION = Pattern.compile("^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$");

    public AuditEntry {
        Objects.requireNonNull(actorType, "actorType");
        Objects.requireNonNull(outcome, "outcome");
        if (action == null || !ACTION.matcher(action).matches() || action.length() > 100) {
            throw new IllegalArgumentException("action must be a dotted lower-case name, e.g. card.published");
        }
        details = details == null ? Map.of() : Map.copyOf(details);
    }

    public enum ActorType { USER, PLATFORM_ADMIN, SYSTEM, ANONYMOUS, INTEGRATION }

    public enum Outcome { SUCCESS, DENIED, FAILURE }
}
