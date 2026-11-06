/**
 * Identity module. Accounts, sign-in verification, server-managed sessions and the authenticated principal. Phase 1. Source: UC-01, IDM-REQ-010..013.
 *
 * <p>Module boundaries are verified by {@code ModularityTests}. Other modules may only use
 * types in this top-level package (its public API); sub-packages are internal.
 */
@ApplicationModule(displayName = "Identity")
package net.inspironics.idme.identity;

import org.springframework.modulith.ApplicationModule;
