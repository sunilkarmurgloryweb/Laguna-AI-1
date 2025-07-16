import dayjs from 'dayjs';

export const getCurrentMonthYear = () => {
  const now = dayjs();
  return {
    month: now.month() + 1, // dayjs months are 0-indexed
    year: now.year(),
    monthName: now.format('MMMM'),
    formatted: now.format('MMMM YYYY')
  };
};

export const getDefaultCheckInDate = () => {
  return dayjs().add(1, 'day').format('YYYY-MM-DD');
};

export const getDefaultCheckOutDate = () => {
  return dayjs().add(2, 'day').format('YYYY-MM-DD');
};

export const formatDateForDisplay = (date: string | Date) => {
  return dayjs(date).format('MMM DD, YYYY');
};

export const formatDateForInput = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const isValidDate = (date: string) => {
  return dayjs(date).isValid();
};

export const isDateInPast = (date: string) => {
  return dayjs(date).isBefore(dayjs(), 'day');
};

export const isCheckOutAfterCheckIn = (checkIn: string, checkOut: string) => {
  return dayjs(checkOut).isAfter(dayjs(checkIn), 'day');
};

export const calculateNights = (checkIn: string, checkOut: string) => {
  return dayjs(checkOut).diff(dayjs(checkIn), 'day');
};

export const addDaysToDate = (date: string, days: number) => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
};

export const getMonthDateRange = (month: number, year: number) => {
  const start = dayjs().year(year).month(month - 1).startOf('month');
  const end = dayjs().year(year).month(month - 1).endOf('month');
  
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD'),
    days: end.diff(start, 'day') + 1
  };
};