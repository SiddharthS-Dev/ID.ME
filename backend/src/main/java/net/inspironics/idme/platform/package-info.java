/**
 * Platform shared kernel: security baseline, web conventions (RFC 9457 problem details), audit
 * trail and configuration. Open to every module; it must never depend on a business module.
 */
@ApplicationModule(displayName = "Platform", type = ApplicationModule.Type.OPEN)
package net.inspironics.idme.platform;

import org.springframework.modulith.ApplicationModule;
