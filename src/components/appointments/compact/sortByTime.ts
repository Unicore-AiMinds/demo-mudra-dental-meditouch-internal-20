// "9:15 AM" -> minutes since midnight
export const timeToMinutes = (time: string) => {
  const [clock, modifier] = time.split(' ');
  let hours = parseInt(clock.split(':')[0]);
  const minutes = parseInt(clock.split(':')[1]);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// Copy of the list ordered by appointment time (display only)
export const sortByTime = <T extends { time: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
