import dayjs from 'dayjs';

export function getWeekRange(date) {
  const d = dayjs(date);
  const day = d.day(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = d.add(diffToMonday, 'day').startOf('day');
  const sunday = monday.add(6, 'day').endOf('day');
  return {
    from: monday.format('YYYY-MM-DD'),
    to: sunday.format('YYYY-MM-DD'),
    label: `${monday.format('DD/MM')} - ${sunday.format('DD/MM')}`
  };
}

export function generateWeeksOfYearSimple(year) {
  const weeks = [];
  let d = dayjs(`${year}-01-01`);
  const day = d.day();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  let monday = d.add(diffToMonday, 'day').startOf('day');
  let weekIndex = 1;
  const endOfYear = dayjs(`${year}-12-31`).endOf('day');
  while (monday.isBefore(endOfYear) || monday.isSame(endOfYear, 'day')) {
    const start = monday;
    const end = monday.add(6, 'day').endOf('day');
    weeks.push({
      week: weekIndex,
      label: `Tuần ${weekIndex}: ${start.format('DD/MM')} - ${end.format('DD/MM')}`,
      from: start.format('YYYY-MM-DD'),
      to: end.format('YYYY-MM-DD'),
      fromTs: start.valueOf(),
      toTs: end.valueOf()
    });
    weekIndex++;
    monday = monday.add(7, 'day');
    if (weekIndex > 60) break;
  }
  return weeks;
}

export function buildDaysOfWeek(fromDateStr) {
  const from = dayjs(fromDateStr);
  return Array.from({ length: 7 }).map((_, i) => {
    const day = from.add(i, 'day');
    return { key: i, label: day.format('ddd'), date: day.format('DD/MM') };
  });
}
