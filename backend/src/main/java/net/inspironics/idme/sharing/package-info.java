/**
 * Sharing module. Public card delivery, share tokens per channel (link, QR, NFC), vCard, revocation and slug redirects. Phase 2. Source: UC-06, UC-07, UC-09.
 *
 * <p>Module boundaries are verified by {@code ModularityTests}. Other modules may only use
 * types in this top-level package (its public API); sub-packages are internal.
 */
@ApplicationModule(displayName = "Sharing")
package net.inspironics.idme.sharing;

import org.springframework.modulith.ApplicationModule;
