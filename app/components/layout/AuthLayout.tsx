import { Link } from "react-router";

type AuthLayoutProps = {
  readonly children: React.ReactNode;
  readonly title: string;
  readonly description?: string;
};

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-primary">
            dot-reservation
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-text">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-text-secondary">{description}</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-white px-6 py-8 shadow-sm sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
