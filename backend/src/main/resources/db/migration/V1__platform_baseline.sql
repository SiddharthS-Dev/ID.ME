-- V1: platform baseline (Phase 0).
-- Runs as the schema owner role (Flyway). The runtime role ${appRole} receives only explicit grants.
-- Requires PostgreSQL 18+ for the built-in uuidv7() (ADR-0002, ADR-0006).

-- The runtime role may use the schema but never create objects in it.
GRANT USAGE ON SCHEMA ${flyway:defaultSchema} TO ${appRole};
REVOKE CREATE ON SCHEMA ${flyway:defaultSchema} FROM PUBLIC;

-- Tables created later by the owner grant standard DML to the runtime role by default.
-- Exceptions (such as audit_event) revoke privileges explicitly after creation.
ALTER DEFAULT PRIVILEGES IN SCHEMA ${flyway:defaultSchema}
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appRole};
ALTER DEFAULT PRIVILEGES IN SCHEMA ${flyway:defaultSchema}
    GRANT USAGE, SELECT ON SEQUENCES TO ${appRole};

-- ---------------------------------------------------------------------------
-- Append-only audit trail (UC-39, IDM-REQ-030; engineering note §6 "immutable audit event stream").
-- ---------------------------------------------------------------------------
CREATE TABLE audit_event (
    id           uuid        PRIMARY KEY DEFAULT uuidv7(),
    occurred_at  timestamptz NOT NULL DEFAULT clock_timestamp(),
    tenant_id    uuid        NULL,           -- NULL only for platform-level events
    actor_type   text        NOT NULL CHECK (actor_type IN ('USER', 'PLATFORM_ADMIN', 'SYSTEM', 'ANONYMOUS', 'INTEGRATION')),
    actor_id     uuid        NULL,
    action       text        NOT NULL CHECK (action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$' AND length(action) <= 100),
    target_type  text        NULL CHECK (length(target_type) <= 60),
    target_id    text        NULL CHECK (length(target_id) <= 200),
    outcome      text        NOT NULL CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILURE')),
    trace_id     text        NULL CHECK (length(trace_id) <= 64),
    details      jsonb       NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object' AND pg_column_size(details) <= 8192)
);

COMMENT ON TABLE audit_event IS 'Append-only audit trail. Runtime role has INSERT/SELECT only; triggers reject UPDATE/DELETE/TRUNCATE. Retention purge is a controlled owner-only procedure (see docs/data-model.md).';

CREATE INDEX audit_event_tenant_time_idx ON audit_event (tenant_id, occurred_at DESC);
CREATE INDEX audit_event_actor_time_idx  ON audit_event (actor_id, occurred_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX audit_event_action_time_idx ON audit_event (action, occurred_at DESC);

CREATE FUNCTION reject_audit_mutation() RETURNS trigger
    LANGUAGE plpgsql AS
$$
BEGIN
    RAISE EXCEPTION 'audit_event is append-only (% rejected)', TG_OP
        USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER audit_event_no_update_delete
    BEFORE UPDATE OR DELETE ON audit_event
    FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();

CREATE TRIGGER audit_event_no_truncate
    BEFORE TRUNCATE ON audit_event
    FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_mutation();

-- Defense in depth: the runtime role can append and read, never modify.
REVOKE UPDATE, DELETE, TRUNCATE ON audit_event FROM ${appRole};
GRANT SELECT, INSERT ON audit_event TO ${appRole};
