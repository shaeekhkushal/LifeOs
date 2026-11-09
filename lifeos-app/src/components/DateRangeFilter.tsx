"use client";

import { dateRangeOptions, type DateRangePeriod } from "@/lib/date-range";
import { getToday } from "@/lib/utils";

export default function DateRangeFilter({
  label,
  period,
  customStart,
  customEnd,
  onPeriodChange,
  onCustomStartChange,
  onCustomEndChange,
  className = "",
}: {
  label: string;
  period: DateRangePeriod;
  customStart: string;
  customEnd: string;
  onPeriodChange: (period: DateRangePeriod) => void;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
  className?: string;
}) {
  return <div className={`date-range-filter ${className}`}>
    <label className="date-range-label">{label}<select className="date-range-select" value={period} onChange={event => onPeriodChange(event.target.value as DateRangePeriod)}>
      {dateRangeOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
    </select></label>
    {period === "custom" && <>
      <label className="date-range-label">From<input className="date-range-input" type="date" value={customStart} max={customEnd || getToday()} onChange={event => onCustomStartChange(event.target.value)} /></label>
      <label className="date-range-label">To<input className="date-range-input" type="date" value={customEnd} min={customStart} max={getToday()} onChange={event => onCustomEndChange(event.target.value)} /></label>
    </>}
  </div>;
}
