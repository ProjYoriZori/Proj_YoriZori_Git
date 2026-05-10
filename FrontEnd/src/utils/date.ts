export const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const getTodayKey = () => formatDateKey(new Date());

export const getYesterdayKey = () => {
  const now = new Date();
  return formatDateKey(new Date(now.getTime() - 86400000));
};
