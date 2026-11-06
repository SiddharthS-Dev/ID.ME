import { ArrowRight, Contact, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

const STEPS = [
  { icon: CreditCard, title: "Create", text: "Build a professional card with your role, company and contact channels." },
  { icon: QrCode, title: "Connect", text: "Share it by link or QR code; NFC tags open the same stable web address." },
  { icon: Contact, title: "Capture", text: "People who want to stay in touch can share their details back, with clear choices." },
  { icon: ShieldCheck, title: "Stay in control", text: "Marketing permission is separate from exchanging cards, and can be withdrawn." },
];

/** Public website entry point. Contains no performance claims, testimonials or third-party logos. */
export function PublicHomePage() {
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 rounded-md bg-accent-300 px-3 py-2 font-semibold text-navy-950">
        Skip to main content
      </a>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <img src="/favicon.svg" alt="" className="size-8" />
          <span>
            ID<span className="text-accent-300">.</span>Me
          </span>
          <span className="ml-1 text-sm font-normal text-muted">by Inspironics</span>
        </span>
        <Link to="/app" className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-navy-700">
          Workspace preview
        </Link>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-16">
        <section className="max-w-3xl">
          <p className="mb-3 inline-block rounded-full border border-brand-400/40 bg-brand-500/10 px-3 py-1 text-sm text-brand-300">
            In development · Phase 0 foundation
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Your professional identity, shared simply and followed up properly.
          </h1>
          <p className="mt-5 text-lg text-muted">
            ID.Me helps professionals and teams create digital business cards, exchange contact details with consent, and turn
            conversations into owned, measurable follow-ups.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-[var(--shadow-glow)] hover:bg-brand-500"
            >
              Open the workspace preview <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted">Accounts and sign-in are delivered in Phase 1.</p>
        </section>
        <section aria-labelledby="how-heading" className="mt-16">
          <h2 id="how-heading" className="text-xl font-semibold">
            How it works
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="surface-card p-5">
                <Icon aria-hidden="true" className="mb-3 size-7 text-accent-300" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
