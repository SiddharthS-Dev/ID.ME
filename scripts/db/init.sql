-- ID.Me database bootstrap (development and test only).
-- Run as a PostgreSQL superuser with psql variables:
--   psql -v owner_password=... -v app_password=... -f init.sql
--
-- Two roles implement least privilege (see docs/decisions/ADR-0004 and ADR-0006):
--   idme_owner : owns the schema; used only by Flyway migrations.
--   idme_app   : runtime role; receives only the DML grants that migrations give it.
-- Production credentials must come from a secret manager, never from this file.

SELECT 'CREATE ROLE idme_owner LOGIN PASSWORD ' || quote_literal(:'owner_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'idme_owner') \gexec

SELECT 'CREATE ROLE idme_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD ' || quote_literal(:'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'idme_app') \gexec

SELECT 'CREATE DATABASE idme OWNER idme_owner ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'idme') \gexec

SELECT 'CREATE DATABASE idme_test OWNER idme_owner ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'idme_test') \gexec

REVOKE ALL ON DATABASE idme FROM PUBLIC;
REVOKE ALL ON DATABASE idme_test FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE idme TO idme_app;
GRANT CONNECT, TEMPORARY ON DATABASE idme_test TO idme_app;
