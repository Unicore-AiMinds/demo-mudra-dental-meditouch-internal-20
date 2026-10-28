// Stock Tracker quantity rule: the item's quantity is what is left in its batches.
// Counting from the batches (instead of adding to / taking from the old number) means a count
// that stopped matching the batches corrects itself at the next Record Incoming / Consumption.

// fallback: used when no batches could be read (e.g. a failed fetch), so nothing drops to 0 by mistake
export const quantityFromBatches = (batches: { current_quantity: number }[], fallback: number) =>
  batches.length > 0 ? batches.reduce((total, batch) => total + batch.current_quantity, 0) : fallback;
