package net.inspironics.idme.platform.audit;

import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

/**
 * Append-only audit trail (UC-39, IDM-REQ-030). The runtime database role may only INSERT and
 * SELECT on {@code audit_event}; a trigger additionally rejects UPDATE, DELETE and TRUNCATE.
 *
 * <p>Callers must not put secrets, tokens, private notes or full contact details in {@code details}.
 */
@Service
public class AuditLog {

    private final JdbcClient jdbc;
    private final JsonMapper jsonMapper;

    AuditLog(JdbcClient jdbc, JsonMapper jsonMapper) {
        this.jdbc = jdbc;
        this.jsonMapper = jsonMapper;
    }

    /** Records an event in the caller's transaction so the audit entry commits with the change it describes. */
    @Transactional(propagation = Propagation.MANDATORY)
    public UUID record(AuditEntry entry) {
        return insert(entry);
    }

    /** Records an event in its own transaction, for denials and failures where the caller rolls back. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UUID recordIndependently(AuditEntry entry) {
        return insert(entry);
    }

    private UUID insert(AuditEntry entry) {
        return jdbc.sql("""
                        INSERT INTO audit_event (tenant_id, actor_type, actor_id, action, target_type, target_id, outcome, trace_id, details)
                        VALUES (:tenantId, :actorType, :actorId, :action, :targetType, :targetId, :outcome, :traceId, CAST(:details AS jsonb))
                        RETURNING id
                        """)
                .param("tenantId", entry.tenantId())
                .param("actorType", entry.actorType().name())
                .param("actorId", entry.actorId())
                .param("action", entry.action())
                .param("targetType", entry.targetType())
                .param("targetId", entry.targetId())
                .param("outcome", entry.outcome().name())
                .param("traceId", entry.traceId())
                .param("details", jsonMapper.writeValueAsString(entry.details()))
                .query(UUID.class)
                .single();
    }
}
