import { AlertCircle, Home, RefreshCw } from "lucide-react";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
} from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import type { Route } from "./+types/root";
import "./styles/index.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const navigate = useNavigate();

  let title = "エラーが発生しました";
  let message = "予期しないエラーが発生しました。";
  let statusCode: number | undefined;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    if (error.status === 401) {
      title = "認証が必要です";
      message = "この操作を行うにはログインが必要です。";
    } else if (error.status === 403) {
      title = "アクセス権限がありません";
      message = "このページにアクセスする権限がありません。";
    } else if (error.status === 404) {
      title = "ページが見つかりません";
      message = "お探しのページは存在しないか、移動した可能性があります。";
    } else if (error.status >= 500) {
      title = "サーバーエラー";
      message =
        "サーバーで問題が発生しました。しばらく時間をおいて再度お試しください。";
    } else {
      message = error.statusText || message;
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    message = error.message;
    stack = error.stack;
  }

  const handleRetry = () => {
    navigate(0);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Alert variant="default">
          <AlertCircle className="size-5" aria-hidden="true" />
          <AlertTitle className="flex items-center gap-2">
            {statusCode && (
              <span className="font-mono text-lg">{statusCode}</span>
            )}
            {title}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm">{message}</p>
            {stack && import.meta.env.DEV && (
              <pre className="w-full mt-4 max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
                <code>{stack}</code>
              </pre>
            )}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                再試行
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <Home className="mr-2 size-4" aria-hidden="true" />
                  ホームに戻る
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </main>
  );
}
