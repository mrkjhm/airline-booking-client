import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Eye, EyeOff, Plane, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/auth-api";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [{ title: "Sign Up — SunJet" }],
  }),
});

const BG_IMAGE =
  "https://images.pexels.com/photos/14923430/pexels-photo-14923430.jpeg?auto=compress&cs=tinysrgb&h=1200&w=2000";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobileNumber: string;
  dateOfBirth: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  mobileNumber: "",
  dateOfBirth: "",
};

function RegisterPage() {
  const navigate = Route.useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
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

  const setField = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = "This field cannot be left blank";
    if (!form.lastName.trim()) nextErrors.lastName = "This field cannot be left blank";
    if (!form.email.trim()) nextErrors.email = "This field cannot be left blank";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      nextErrors.email = "Enter a valid email address";
    if (!form.password) nextErrors.password = "This field cannot be left blank";
    else if (form.password.length < 8)
      nextErrors.password = "Password must be at least 8 characters";
    if (form.mobileNumber.trim() && form.mobileNumber.trim().length < 11) {
      nextErrors.mobileNumber = "Input valid mobile number";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await registerUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        passwordHash: form.password,
        ...(form.mobileNumber.trim() ? { mobileNumber: form.mobileNumber.trim() } : {}),
        ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
      });

      await navigate({ to: "/login" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create account");
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
            Create your GetMore account
          </h1>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="firstName" className="text-sm font-bold text-secondary">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={setField("firstName")}
                  className={`mt-1.5 h-11 ${errors.firstName ? "border-accent focus-visible:ring-accent" : ""}`}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && <FieldError message={errors.firstName} />}
              </div>
              <div className="flex-1">
                <Label htmlFor="lastName" className="text-sm font-bold text-secondary">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={setField("lastName")}
                  className={`mt-1.5 h-11 ${errors.lastName ? "border-accent focus-visible:ring-accent" : ""}`}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && <FieldError message={errors.lastName} />}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-bold text-secondary">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={setField("email")}
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
                  onChange={setField("password")}
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

            <div>
              <Label htmlFor="mobileNumber" className="text-sm font-bold text-secondary">
                Mobile Number
              </Label>
              <Input
                id="mobileNumber"
                type="tel"
                value={form.mobileNumber}
                onChange={setField("mobileNumber")}
                placeholder="Optional"
                className={`mt-1.5 h-11 ${errors.mobileNumber ? "border-accent focus-visible:ring-accent" : ""}`}
                aria-invalid={!!errors.mobileNumber}
              />
              {errors.mobileNumber && <FieldError message={errors.mobileNumber} />}
            </div>

            <div>
              <Label htmlFor="dateOfBirth" className="text-sm font-bold text-secondary">
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={setField("dateOfBirth")}
                className={`mt-1.5 h-11 ${errors.dateOfBirth ? "border-accent focus-visible:ring-accent" : ""}`}
                aria-invalid={!!errors.dateOfBirth}
              />
              {errors.dateOfBirth && <FieldError message={errors.dateOfBirth} />}
            </div>

            {submitError && <FieldError message={submitError} />}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-11 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </div>

        <div className="border-t border-border px-8 py-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
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
