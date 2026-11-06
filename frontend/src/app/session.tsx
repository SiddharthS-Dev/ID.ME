import { createContext, useContext, type ReactNode } from "react";
import type { Role } from "./navigation";

/**
 * Client-side view of the signed-in session, used only to shape the UI. The backend enforces every
 * permission independently (docs/permissions.md). Phase 0 has no authentication, so roles are empty.
 */
export interface SessionView {
  roles: readonly Role[];
}

const SessionContext = createContext<SessionView>({ roles: [] });

export function SessionProvider({ value, children }: { value: SessionView; children: ReactNode }) {
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionView {
  return useContext(SessionContext);
}
