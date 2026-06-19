import dayjs from "dayjs";

export function formatCurrency(value, currency = "VND") {
  const amount = Number(value || 0);
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount / 24000);
  }
  if (currency === "EUR") {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount / 26000);
  }
  return `${amount.toLocaleString("vi-VN")} VND`;
}

export function formatDate(value) {
  return dayjs(value).format("DD/MM/YYYY");
}

export function monthKey(value) {
  return dayjs(value).format("YYYY-MM");
}

export function monthLabel(value) {
  return dayjs(`${value}-01`).format("MM/YYYY");
}
