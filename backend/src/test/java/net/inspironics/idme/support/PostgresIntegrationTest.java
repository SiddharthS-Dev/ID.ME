package net.inspironics.idme.support;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/** Base class for full-context integration tests against real PostgreSQL. */
@SpringBootTest
public abstract class PostgresIntegrationTest {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        TestDatabase.Settings db = TestDatabase.get();
        registry.add("spring.datasource.url", db::jdbcUrl);
        registry.add("spring.datasource.username", db::appUser);
        registry.add("spring.datasource.password", db::appPassword);
        registry.add("spring.flyway.user", db::ownerUser);
        registry.add("spring.flyway.password", db::ownerPassword);
        registry.add("spring.flyway.placeholders.appRole", db::appUser);
        registry.add("idme.environment", () -> "test");
    }

    /** Opens a connection as the schema owner, for assertions that need owner privileges. */
    protected static Connection ownerConnection() throws SQLException {
        TestDatabase.Settings db = TestDatabase.get();
        Connection c = DriverManager.getConnection(db.jdbcUrl(), db.ownerUser(), db.ownerPassword());
        c.setSchema("idme");
        return c;
    }

    /** Opens a connection as the restricted runtime role. */
    protected static Connection appConnection() throws SQLException {
        TestDatabase.Settings db = TestDatabase.get();
        Connection c = DriverManager.getConnection(db.jdbcUrl(), db.appUser(), db.appPassword());
        c.setSchema("idme");
        return c;
    }
}
