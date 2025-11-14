// Wine Spectator Top 100 Configuration
// Update this value each year to reflect the current Top 100 year

export const CURRENT_TOP100_YEAR = 2025;

// Derived configuration
export const EARLIEST_YEAR = 1988;
export const YEAR_RANGE = Array.from(
  { length: CURRENT_TOP100_YEAR - EARLIEST_YEAR + 1 }, 
  (_, i) => CURRENT_TOP100_YEAR - i
);
