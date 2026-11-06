import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { visibleNavItems, type Role } from "./navigation";
import { useSession } from "./session";

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md text-ink no-underline">
      <img src="/favicon.svg" alt="" className="size-8" />
      <span className="text-lg font-semibold tracking-tight">
        ID<span className="text-accent-300">.</span>Me
      </span>
    </Link>
  );
}

function NavList({ roles, onNavigate }: { roles: readonly Role[]; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {visibleNavItems(roles).map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id}>
            <NavLink
              to={item.path}
              end={item.path === "/app"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-500/20 text-ink shadow-[inset_3px_0_0_var(--color-accent-400)]"
                    : "text-muted hover:bg-navy-700 hover:text-ink"
                }`
              }
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Responsive workspace layout: persistent sidebar from the `lg` breakpoint, modal navigation drawer
 * below it. The drawer traps nothing beyond itself, closes on Escape or navigation, and returns
 * focus to the menu button.
 */
export function AppShell() {
  const { roles } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const drawerId = useId();
  const location = useLocation();

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuButton.current?.focus();
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    drawer.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  // Move focus to the main heading after client-side navigation so screen-reader users hear the new page.
  // Compare with the previous path (not a "first render" flag) so StrictMode's double effect run and the
  // initial page load never steal focus from the skip link.
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    main.current?.querySelector<HTMLElement>("h1")?.focus();
  }, [location.pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent-300 px-3 py-2 font-semibold text-navy-950 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>

      <aside className="hidden border-r border-line/70 bg-navy-900/80 lg:flex lg:flex-col" aria-label="Workspace">
        <div className="px-5 py-5">
          <BrandMark />
        </div>
        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 pb-6">
          <NavList roles={roles} />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line/70 bg-navy-900/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            ref={menuButton}
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg text-ink hover:bg-navy-700 lg:hidden"
            aria-expanded={drawerOpen}
            aria-controls={drawerId}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu aria-hidden="true" className="size-6" />
            <span className="sr-only">Open navigation</span>
          </button>
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <p className="ml-auto rounded-full border border-warning-400/40 bg-warning-400/10 px-3 py-1 text-xs font-medium text-warning-400">
            Development preview · sign-in arrives in Phase 1
          </p>
        </header>

        <main id="main" ref={main} tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/80" aria-hidden="true" onClick={closeDrawer} />
          <div
            ref={drawer}
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-navy-900 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <BrandMark />
              <button type="button" onClick={closeDrawer} className="inline-flex size-10 items-center justify-center rounded-lg text-ink hover:bg-navy-700">
                <X aria-hidden="true" className="size-6" />
                <span className="sr-only">Close navigation</span>
              </button>
            </div>
            <nav aria-label="Primary" className="overflow-y-auto">
              <NavList roles={roles} onNavigate={() => setDrawerOpen(false)} />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
