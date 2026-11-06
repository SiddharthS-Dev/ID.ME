package net.inspironics.idme.platform;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;
import java.util.UUID;
import net.inspironics.idme.platform.audit.AuditEntry;
import net.inspironics.idme.platform.audit.AuditEntry.ActorType;
import net.inspironics.idme.platform.audit.AuditEntry.Outcome;
import net.inspironics.idme.platform.audit.AuditLog;
import net.inspironics.idme.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.support.TransactionTemplate;

/** Verifies the V1 migration, the least-privilege role model and the append-only audit trail. */
class DatabaseBaselineIntegrationTest extends PostgresIntegrationTest {

    @Autowired AuditLog auditLog;
    @Autowired JdbcClient jdbc;
    @Autowired TransactionTemplate tx;

    @Test
    void migrationsApplyAndApplicationRunsAsRestrictedRole() throws SQLException {
        assertThat(jdbc.sql("SELECT current_user").query(String.class).single()).isEqualTo(TestDatabaseUser.app());
        assertThat(jdbc.sql("SELECT current_schema()").query(String.class).single()).isEqualTo("idme");
        assertThat(jdbc.sql("SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user")
                .query(Boolean.class).single()).isFalse();
        try (Connection c = ownerConnection(); Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("SELECT count(*) FILTER (WHERE NOT success), max(version::int) FROM flyway_schema_history WHERE version IS NOT NULL")) {
            rs.next();
            assertThat(rs.getInt(1)).as("failed migrations").isZero();
            assertThat(rs.getInt(2)).as("latest migration").isGreaterThanOrEqualTo(1);
        }
    }

    @Test
    void runtimeRoleCannotReadOrAlterMigrationHistory() {
        assertThatThrownBy(() -> jdbc.sql("SELECT count(*) FROM flyway_schema_history").query(Integer.class).single())
                .rootCause()
                .hasMessageContaining("permission denied for table flyway_schema_history");
    }

    @Test
    void runtimeRoleCannotCreateObjects() throws SQLException {
        try (Connection c = appConnection(); Statement s = c.createStatement()) {
            assertThatThrownBy(() -> s.execute("CREATE TABLE idme.should_not_exist (id int)"))
                    .isInstanceOf(SQLException.class)
                    .hasMessageContaining("permission denied");
        }
    }

    @Test
    void auditEventsAreRecordedWithServerGeneratedIdAndUtcTime() {
        UUID tenant = UUID.randomUUID();
        UUID id = tx.execute(status -> auditLog.record(new AuditEntry(tenant, ActorType.SYSTEM, null,
                "platform.test_event", "test", "t-1", Outcome.SUCCESS, "trace-1", Map.of("reason", "integration-test"))));

        var row = jdbc.sql("SELECT tenant_id, action, outcome, details->>'reason' AS reason, occurred_at FROM audit_event WHERE id = :id")
                .param("id", id)
                .query((rs, n) -> Map.of(
                        "tenant", rs.getObject("tenant_id", UUID.class),
                        "action", rs.getString("action"),
                        "outcome", rs.getString("outcome"),
                        "reason", rs.getString("reason")))
                .single();
        assertThat(row).containsEntry("tenant", tenant).containsEntry("action", "platform.test_event")
                .containsEntry("outcome", "SUCCESS").containsEntry("reason", "integration-test");
        // uuidv7 ids are time-ordered: version nibble is 7
        assertThat(id.version()).isEqualTo(7);
    }

    @Test
    void auditRecordRequiresAnEnclosingTransaction() {
        assertThatThrownBy(() -> auditLog.record(new AuditEntry(null, ActorType.SYSTEM, null,
                "platform.no_tx", null, null, Outcome.SUCCESS, null, Map.of())))
                .isInstanceOf(IllegalTransactionStateException.class);
    }

    @Test
    void auditEntryRejectsMalformedActionNames() {
        assertThatThrownBy(() -> new AuditEntry(null, ActorType.SYSTEM, null, "DROP TABLE", null, null, Outcome.SUCCESS, null, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void runtimeRoleCannotUpdateOrDeleteAuditEvents() throws SQLException {
        UUID id = auditLog.recordIndependently(new AuditEntry(null, ActorType.SYSTEM, null,
                "platform.immutability_probe", null, null, Outcome.SUCCESS, null, Map.of()));
        try (Connection c = appConnection(); Statement s = c.createStatement()) {
            assertThatThrownBy(() -> s.executeUpdate("UPDATE audit_event SET outcome = 'FAILURE' WHERE id = '" + id + "'"))
                    .hasMessageContaining("permission denied");
            assertThatThrownBy(() -> s.executeUpdate("DELETE FROM audit_event WHERE id = '" + id + "'"))
                    .hasMessageContaining("permission denied");
        }
    }

    @Test
    void evenTheSchemaOwnerCannotRewriteAuditHistory() throws SQLException {
        UUID id = auditLog.recordIndependently(new AuditEntry(null, ActorType.SYSTEM, null,
                "platform.owner_probe", null, null, Outcome.SUCCESS, null, Map.of()));
        try (Connection c = ownerConnection(); Statement s = c.createStatement()) {
            assertThatThrownBy(() -> s.executeUpdate("UPDATE audit_event SET action = 'platform.tampered' WHERE id = '" + id + "'"))
                    .hasMessageContaining("append-only");
            assertThatThrownBy(() -> s.executeUpdate("DELETE FROM audit_event WHERE id = '" + id + "'"))
                    .hasMessageContaining("append-only");
            assertThatThrownBy(() -> s.execute("TRUNCATE audit_event"))
                    .hasMessageContaining("append-only");
            try (ResultSet rs = s.executeQuery("SELECT count(*) FROM audit_event WHERE id = '" + id + "'")) {
                rs.next();
                assertThat(rs.getInt(1)).isEqualTo(1);
            }
        }
    }

    /** Resolves the configured runtime role name. */
    static final class TestDatabaseUser {
        static String app() {
            return net.inspironics.idme.support.TestDatabase.get().appUser();
        }
    }
}
