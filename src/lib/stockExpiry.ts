// Expiry rules shared by Stock Tracker, its batch list and the Dashboard stock cards.
// The expiry date itself is still usable; stock is expired from the next day.

const EXPIRING_SOON_DAYS = 60;

// Local midnight of a date; 'yyyy-MM-dd' strings are read as that calendar day (not UTC)
const startOfLocalDay = (value: string | Date) => {
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Whole days from today to the expiry date: 0 on the expiry day, negative once expired
export const daysUntilExpiry = (expiryDate: string, now: Date = new Date()) =>
  Math.round((startOfLocalDay(expiryDate).getTime() - startOfLocalDay(now).getTime()) / 86400000);

export const isPastExpiry = (expiryDate: string, now: Date = new Date()) => daysUntilExpiry(expiryDate, now) < 0;

// From the expiry day itself up to 60 days ahead
export const isWithinExpiryWindow = (expiryDate: string, now: Date = new Date()) => {
  const days = daysUntilExpiry(expiryDate, now);
  return days >= 0 && days <= EXPIRING_SOON_DAYS;
};
