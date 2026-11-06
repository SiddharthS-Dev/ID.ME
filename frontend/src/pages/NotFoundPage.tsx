import { SearchX } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "../components/ui";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState icon={SearchX} title="We couldn't find that page">
        <p>The page you are looking for does not exist or is no longer available.</p>
        <p className="mt-4">
          <Link to="/" className="font-medium text-accent-300 underline underline-offset-4">
            Go to the home page
          </Link>
        </p>
      </EmptyState>
    </div>
  );
}
