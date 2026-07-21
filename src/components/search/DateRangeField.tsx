import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { getTodayInputValue } from "@/components/search/SearchFormFields";

function parseDate(value: string) {
  return value ? parseISO(value) : undefined;
}

function formatDisplayDate(value: string, fallback: string) {
  const date = parseDate(value);
  return date ? format(date, "dd MMM yyyy") : fallback;
}

export function DateRangeField({
  tripType,
  departureDate,
  returnDate,
  onChangeDeparture,
  onChangeReturn,
  variant = "widget",
}: {
  tripType: "roundtrip" | "oneway";
  departureDate: string;
  returnDate: string;
  onChangeDeparture: (value: string) => void;
  onChangeReturn: (value: string) => void;
  variant?: "widget" | "modal";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftDeparture, setDraftDeparture] = useState(departureDate);
  const [draftReturn, setDraftReturn] = useState(returnDate);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const today = parseDate(getTodayInputValue()) as Date;
  const draftRange: DateRange | undefined = {
    from: parseDate(draftDeparture),
    to: tripType === "roundtrip" ? parseDate(draftReturn) : undefined,
  };
  const draftSingle = parseDate(draftDeparture);

  const togglePicker = () => {
    setIsOpen((open) => {
      const next = !open;
      if (next) {
        setDraftDeparture(departureDate);
        setDraftReturn(returnDate);
      }
      return next;
    });
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setDraftDeparture(range?.from ? format(range.from, "yyyy-MM-dd") : "");
    setDraftReturn(range?.to ? format(range.to, "yyyy-MM-dd") : "");
  };

  const handleSingleSelect = (date: Date | undefined) => {
    setDraftDeparture(date ? format(date, "yyyy-MM-dd") : "");
    setDraftReturn("");
  };

  const handleConfirm = () => {
    onChangeDeparture(draftDeparture);
    onChangeReturn(tripType === "roundtrip" ? draftReturn : "");
    setIsOpen(false);
  };

  const isWidget = variant === "widget";

  return (
    <div
      ref={containerRef}
      className={`relative ${tripType === "roundtrip" ? "col-span-2 sm:col-span-2" : "col-span-1"}`}
    >
      <div
        className={
          tripType === "roundtrip"
            ? isWidget
              ? "grid h-full grid-cols-2"
              : "flex flex-col divide-y divide-border sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0"
            : isWidget
              ? "flex h-full flex-col"
              : "flex flex-col"
        }
      >
        <button
          type="button"
          onClick={togglePicker}
          className={
            isWidget
              ? "flex flex-col border-t border-border px-5 py-4 text-left sm:border-l sm:border-t-0"
              : "flex flex-col gap-1 px-5 py-4 text-left"
          }
        >
          <span
            className={
              isWidget
                ? "text-xs font-semibold text-muted-foreground"
                : "text-sm font-semibold text-muted-foreground"
            }
          >
            Depart
          </span>
          {isWidget ? (
            <span
              className={`mt-1 font-display text-base text-slate-800 ${
                departureDate ? "font-extrabold" : "font-semibold"
              }`}
            >
              {formatDisplayDate(departureDate, "Departure")}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-xl font-bold text-[#30343b]">
              {formatDisplayDate(departureDate, "Departure")}
              <CalendarDays className="ml-auto h-5 w-5 shrink-0 text-muted-foreground/70" />
            </span>
          )}
        </button>

        {tripType === "roundtrip" && (
          <button
            type="button"
            onClick={togglePicker}
            className={
              isWidget
                ? "flex flex-col border-t border-border px-5 py-4 text-left sm:border-l sm:border-t-0"
                : "flex flex-col gap-1 px-5 py-4 text-left"
            }
          >
            <span
              className={
                isWidget
                  ? "text-xs font-semibold text-muted-foreground"
                  : "text-sm font-semibold text-muted-foreground"
              }
            >
              Return
            </span>
            {isWidget ? (
              <span
                className={`mt-1 font-display text-base ${
                  returnDate
                    ? "font-extrabold text-slate-800"
                    : "font-semibold text-muted-foreground/50"
                }`}
              >
                {formatDisplayDate(returnDate, "Returning on")}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-xl font-bold text-[#30343b]">
                <span className={returnDate ? "" : "text-muted-foreground/50"}>
                  {formatDisplayDate(returnDate, "Returning on")}
                </span>
                <CalendarDays className="ml-auto h-5 w-5 shrink-0 text-muted-foreground/70" />
              </span>
            )}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-white p-4 shadow-xl sm:inset-x-auto sm:left-0 sm:w-max sm:p-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-border md:block" />
            {tripType === "roundtrip" ? (
              <Calendar
                mode="range"
                numberOfMonths={2}
                defaultMonth={draftRange.from ?? today}
                selected={draftRange}
                onSelect={handleRangeSelect}
                disabled={{ before: today }}
                classNames={{
                  months: "relative flex flex-col gap-6 md:flex-row",
                  month: "flex w-full flex-col gap-4 md:px-6 md:first:pl-0 md:last:pr-0",
                }}
              />
            ) : (
              <Calendar
                mode="single"
                numberOfMonths={2}
                defaultMonth={draftSingle ?? today}
                selected={draftSingle}
                onSelect={handleSingleSelect}
                disabled={{ before: today }}
                classNames={{
                  months: "relative flex flex-col gap-6 md:flex-row",
                  month: "flex w-full flex-col gap-4 md:px-6 md:first:pl-0 md:last:pr-0",
                }}
              />
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!draftDeparture || (tripType === "roundtrip" && !draftReturn)}
              onClick={handleConfirm}
              className="rounded-full bg-secondary px-6 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Select dates
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
