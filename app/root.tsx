import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import "./styles/index.css";

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const sessionResult = await container.authProvider.getSession(
    request.headers,
  );

  if (!sessionResult) {
    return { session: null };
  }

  return {
    session: {
      user: {
        id: sessionResult.user.id,
        email: sessionResult.user.email,
        name: sessionResult.user.name,
        role: sessionResult.user.role,
      },
    },
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Noto+Sans+JP:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text">{error.status}</h1>
          <p className="mt-2 text-text-secondary">
            {error.statusText || "エラーが発生しました"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-text">エラー</h1>
        <p className="mt-2 text-text-secondary">
          予期しないエラーが発生しました。ページを再読み込みしてください。
        </p>
      </div>
    </div>
  );
}
