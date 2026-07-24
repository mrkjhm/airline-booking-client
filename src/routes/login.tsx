import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Plane, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser, persistAuthSession } from "@/lib/auth-api";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Sign In — SunJet" }],
  }),
});

const BG_IMAGE =
  "https://images.pexels.com/photos/28628306/pexels-photo-28628306.jpeg?auto=compress&cs=tinysrgb&h=1200&w=2000";

function LoginPage() {
  const navigate = Route.useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollbarGutter;
    root.style.scrollbarGutter = "auto";
    return () => {
      root.style.scrollbarGutter = previous;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<"email" | "password", string>> = {};

    if (!form.email.trim()) {
      nextErrors.email = "This field cannot be left blank";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!form.password) {
      nextErrors.password = "This field cannot be left blank";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      persistAuthSession(result);
      await navigate({ to: "/" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <img src={BG_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-abyss/10" />

      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <Link
          to="/"
          aria-label="Close and return to homepage"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-secondary"
        >
          <X className="h-5 w-5" />
        </Link>

        <div className="flex flex-col items-center gap-2 border-b border-border px-8 py-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plane className="h-5 w-5 -rotate-45" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-secondary">
              Sun<span className="text-primary">Jet</span>
            </span>
          </Link>
        </div>

        <div className="px-8 py-8">
          <h1 className="mb-6 text-center text-base font-bold text-secondary">
            Sign in with your GetMore account
          </h1>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email" className="text-sm font-bold text-secondary">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm((current) => ({ ...current, email: e.target.value }));
                  setErrors((current) => ({ ...current, email: undefined }));
                  setSubmitError(null);
                }}
                className={`mt-1.5 h-11 ${errors.email ? "border-accent focus-visible:ring-accent" : ""}`}
                aria-invalid={!!errors.email}
              />
              {errors.email && <FieldError message={errors.email} />}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-bold text-secondary">
                Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => {
                    setForm((current) => ({ ...current, password: e.target.value }));
                    setErrors((current) => ({ ...current, password: undefined }));
                    setSubmitError(null);
                  }}
                  className={`h-11 pr-10 ${errors.password ? "border-accent focus-visible:ring-accent" : ""}`}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-secondary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <FieldError message={errors.password} />}
            </div>

            {submitError && <FieldError message={submitError} />}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-11 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <div className="border-t border-border px-8 py-5 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-accent">
      <span className="grid h-3.5 w-3.5 flex-none place-items-center rounded-full bg-accent text-[9px] text-white">
        !
      </span>
      {message}
    </p>
  );
}
