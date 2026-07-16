import { ChevronDown, CalendarDays, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function SearchTextField({
  label,
  value,
  onChange,
  onClear,
  placeholder,
  options,
  excludeValue,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder: string;
  options?: string[];
  excludeValue?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    if (!options) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [options]);

  const normalizedExcluded = [excludeValue, value]
    .map((entry) => entry?.trim().toLowerCase())
    .filter((entry): entry is string => Boolean(entry));
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = (options ?? []).filter((option) => {
    if (normalizedExcluded.includes(option.toLowerCase())) return false;
    return !normalizedQuery || option.toLowerCase().includes(normalizedQuery);
  });

  return (
    <label ref={containerRef} className="relative flex flex-col gap-1 px-5 py-4 text-left">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-xl font-bold text-[#30343b] outline-none placeholder:text-muted-foreground/50 placeholder:font-semibold"
        />
        {value && (
          <button
            type="button"
            onClick={() => (onClear ? onClear() : onChange(""))}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="grid h-8 w-8 shrink-0 place-items-center text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </span>

      {options && isOpen && filteredOptions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto  border border-border bg-white py-1 shadow-lg">
          {filteredOptions.map((option) => (
            <li key={option}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="block w-full px-4 py-2.5 text-left text-base font-medium text-[#30343b] hover:bg-muted"
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}

export function DateField({
  label,
  value,
  onChange,
  min,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-lg font-medium text-muted-foreground">{label}</span>
      <span className="mt-2 flex h-[72px] items-center  border border-border bg-white px-4 transition focus-within:border-secondary">
        <input
          type="date"
          value={value}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          aria-label={placeholder ?? label}
          className="min-w-0 flex-1 bg-transparent text-xl font-medium text-[#30343b] outline-none placeholder:text-muted-foreground/50"
        />
        <CalendarDays className="h-5 w-5 text-muted-foreground/70" />
      </span>
    </label>
  );
}

export function CountField({
  label,
  helper,
  value,
  min,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-lg font-medium text-muted-foreground">{label}</span>
      <span className="mt-2 flex h-[72px] items-center  border border-border bg-white px-4 transition focus-within:border-secondary">
        <input
          type="number"
          min={min}
          step={1}
          value={value}
          onChange={(event) => onChange(Math.max(min, Number(event.target.value) || min))}
          className="min-w-0 flex-1 bg-transparent text-xl font-medium text-[#30343b] outline-none"
        />
        <ChevronDown className="h-5 w-5 text-muted-foreground" />
      </span>
      <span className="mt-4 block text-sm font-medium text-muted-foreground">{helper}</span>
    </label>
  );
}

export function getTodayInputValue() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
