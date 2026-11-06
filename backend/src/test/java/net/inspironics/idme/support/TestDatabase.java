package net.inspironics.idme.support;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Supplies a real PostgreSQL 18 database for integration tests.
 *
 * <ol>
 *   <li>If {@code IDME_TEST_JDBC_URL} is set, that database is used (for example the local cluster
 *       created by {@code scripts/dev-db.sh init}, database {@code idme_test}).</li>
 *   <li>Otherwise a Testcontainers {@code postgres:18.6} container is started (requires Docker).</li>
 * </ol>
 *
 * In both cases the same two roles exist: {@code idme_owner} runs migrations and {@code idme_app}
 * is the restricted runtime role, so tests exercise the production privilege model.
 */
public final class TestDatabase {

    public record Settings(String jdbcUrl, String ownerUser, String ownerPassword, String appUser, String appPassword) {}

    private static Settings settings;

    private TestDatabase() {}

    public static synchronized Settings get() {
        if (settings == null) {
            settings = System.getenv("IDME_TEST_JDBC_URL") != null ? fromEnvironment() : startContainer();
        }
        return settings;
    }

    private static Settings fromEnvironment() {
        return new Settings(
                System.getenv("IDME_TEST_JDBC_URL"),
                env("IDME_TEST_OWNER_USER", "idme_owner"),
                env("IDME_TEST_OWNER_PASSWORD", "idme_owner_dev"),
                env("IDME_TEST_APP_USER", "idme_app"),
                env("IDME_TEST_APP_PASSWORD", "idme_app_dev"));
    }

    @SuppressWarnings("resource") // container lives for the whole test JVM and is reaped by Testcontainers
    private static Settings startContainer() {
        var container = new PostgreSQLContainer("postgres:18.6").withDatabaseName("idme_test");
        try {
            container.start();
        } catch (RuntimeException e) {
            throw new IllegalStateException("""
                    No test database available. Either start Docker (Testcontainers) or run \
                    scripts/dev-db.sh init and set IDME_TEST_JDBC_URL=jdbc:postgresql://127.0.0.1:55432/idme_test""", e);
        }
        try (Connection c = DriverManager.getConnection(container.getJdbcUrl(), container.getUsername(), container.getPassword());
             Statement s = c.createStatement()) {
            s.execute("CREATE ROLE idme_owner LOGIN PASSWORD 'owner_test'");
            s.execute("CREATE ROLE idme_app LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD 'app_test'");
            s.execute("ALTER DATABASE idme_test OWNER TO idme_owner");
            s.execute("GRANT CONNECT, TEMPORARY ON DATABASE idme_test TO idme_app");
        } catch (SQLException e) {
            throw new IllegalStateException("Could not prepare test roles", e);
        }
        return new Settings(container.getJdbcUrl(), "idme_owner", "owner_test", "idme_app", "app_test");
    }

    private static String env(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }
}
