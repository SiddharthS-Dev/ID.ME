/**
 * Notifications module. Email and push delivery through provider adapters with durable jobs and recorded provider outcomes. Phase 4. Source: UC-17, UC-19.
 *
 * <p>Module boundaries are verified by {@code ModularityTests}. Other modules may only use
 * types in this top-level package (its public API); sub-packages are internal.
 */
@ApplicationModule(displayName = "Notifications")
package net.inspironics.idme.notifications;

import org.springframework.modulith.ApplicationModule;
