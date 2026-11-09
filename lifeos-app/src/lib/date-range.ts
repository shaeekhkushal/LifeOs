import { getToday } from "@/lib/utils";

export type DateRangePeriod = "7d" | "30d" | "month" | "last-month" | "3m" | "6m" | "year" | "custom";

export const dateRangeOptions: Array<{ value: DateRangePeriod; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function getDateRange(period: DateRangePeriod, customStart: string, customEnd: string) {
  const today = parseDate(getToday());
  let start: Date;
  let end = today;

  if (period === "7d") start = addDays(today, -6);
  else if (period === "30d") start = addDays(today, -29);
  else if (period === "month") start = new Date(today.getFullYear(), today.getMonth(), 1);
  else if (period === "last-month") {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    end = new Date(today.getFullYear(), today.getMonth(), 0);
  } else if (period === "3m") start = addMonths(today, -3);
  else if (period === "6m") start = addMonths(today, -6);
  else if (period === "year") start = new Date(today.getFullYear(), 0, 1);
  else {
    start = parseDate(customStart || getToday());
    end = parseDate(customEnd || customStart || getToday());
  }

  if (end < start) end = new Date(start);
  return { start, end };
}

export function dateRangeKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function daysInclusive(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}
