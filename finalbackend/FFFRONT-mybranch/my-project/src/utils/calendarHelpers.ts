interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  color: string;
  calendarId: string;
}

export const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

export const formatYear = (date: Date) => {
  return date.getFullYear();
};

export const formatMonth = (date: Date) => {
  return date.getMonth() + 1; // 월을 숫자로만 반환 (1~12)
};

export const getYearOptions = (currentDate: Date) => {
  const currentYear = currentDate.getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i);
  }
  return years;
};

export const getMonthOptions = () => {
  return Array.from({ length: 12 }, (_, i) => i);
};

export const getEventsForDate = (date: number, currentDate: Date, events: Event[]) => {
  const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
  targetDate.setHours(0, 0, 0, 0);
  
  return events.filter(event => {
    const eventStartDate = new Date(event.startDate);
    const eventEndDate = new Date(event.endDate);
    
    eventStartDate.setHours(0, 0, 0, 0);
    eventEndDate.setHours(0, 0, 0, 0);
    
    return targetDate >= eventStartDate && targetDate <= eventEndDate;
  });
};