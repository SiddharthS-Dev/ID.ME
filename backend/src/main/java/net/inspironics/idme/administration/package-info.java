/**
 * Administration module. Platform administration: tenant lifecycle, audited support access and platform-wide operations. Phase 1/5. Source: UC-26, UC-39.
 *
 * <p>Module boundaries are verified by {@code ModularityTests}. Other modules may only use
 * types in this top-level package (its public API); sub-packages are internal.
 */
@ApplicationModule(displayName = "Administration")
package net.inspironics.idme.administration;

import org.springframework.modulith.ApplicationModule;
