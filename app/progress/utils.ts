import { format, formatDistanceToNow } from "date-fns";

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

export function formatPercent(value: number, digits = 0) {
  if (Number.isNaN(value)) {
    return "0%";
  }

  return `${value.toFixed(digits)}%`;
}

export function formatDate(timestamp: number, pattern = "MMM d, yyyy") {
  return format(new Date(timestamp), pattern);
}

export function formatDateShort(timestamp: number) {
  return formatDate(timestamp, "MMM d");
}

export function formatRelativeTime(timestamp: number) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

