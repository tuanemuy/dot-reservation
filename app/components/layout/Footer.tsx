export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} dot-reservation
        </p>
      </div>
    </footer>
  );
}
