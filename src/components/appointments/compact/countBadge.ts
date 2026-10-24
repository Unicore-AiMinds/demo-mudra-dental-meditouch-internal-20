// Same thresholds and colours as the desktop weekly/monthly capacity badge
export const countBadgeClass = (count: number, isDental: boolean) =>
  count >= (isDental ? 10 : 5) ? 'bg-red-100 text-red-800' :
  count >= (isDental ? 5 : 3) ? 'bg-yellow-100 text-yellow-800' :
  'bg-green-100 text-green-800';
