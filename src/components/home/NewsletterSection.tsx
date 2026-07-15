export function NewsletterSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary/10 px-6 py-12 text-center">
        <h2 className="font-display text-2xl font-extrabold text-secondary sm:text-3xl">
          Never miss a seat sale.
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Sign up for fare alerts and be the first to know when prices drop on your favorite routes.
        </p>
        <form className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button className="shrink-0 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-95">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
