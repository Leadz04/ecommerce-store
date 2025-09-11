export interface Occasion {
  id: string;
  name: string;
  description: string;
  date: Date;
  daysUntil: number;
  orderByDate: Date;
  isActive: boolean;
}

// Calculate days until occasion
function getDaysUntil(targetDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate order by date (2 days before occasion)
function getOrderByDate(occasionDate: Date): Date {
  const orderBy = new Date(occasionDate);
  orderBy.setDate(orderBy.getDate() - 2);
  return orderBy;
}

// Get current year occasions
const currentYear = new Date().getFullYear();

export const upcomingOccasions: Occasion[] = [
  {
    id: 'valentines-day',
    name: 'Valentine\'s Day',
    description: 'Show your love with the perfect gift',
    date: new Date(currentYear, 1, 14), // February 14
    daysUntil: getDaysUntil(new Date(currentYear, 1, 14)),
    orderByDate: getOrderByDate(new Date(currentYear, 1, 14)),
    isActive: true
  },
  {
    id: 'mothers-day',
    name: 'Mother\'s Day',
    description: 'Celebrate the special women in your life',
    date: new Date(currentYear, 4, 14), // Second Sunday in May (approximate)
    daysUntil: getDaysUntil(new Date(currentYear, 4, 14)),
    orderByDate: getOrderByDate(new Date(currentYear, 4, 14)),
    isActive: true
  },
  {
    id: 'fathers-day',
    name: 'Father\'s Day',
    description: 'Honor the fathers and father figures in your life',
    date: new Date(currentYear, 5, 21), // Third Sunday in June (approximate)
    daysUntil: getDaysUntil(new Date(currentYear, 5, 21)),
    orderByDate: getOrderByDate(new Date(currentYear, 5, 21)),
    isActive: true
  },
  {
    id: 'christmas',
    name: 'Christmas',
    description: 'The most wonderful time of the year for gift-giving',
    date: new Date(currentYear, 11, 25), // December 25
    daysUntil: getDaysUntil(new Date(currentYear, 11, 25)),
    orderByDate: getOrderByDate(new Date(currentYear, 11, 25)),
    isActive: true
  }
];

// Get active occasions within the next 30 days
export function getActiveOccasions(): Occasion[] {
  return upcomingOccasions.filter(occasion => 
    occasion.isActive && 
    occasion.daysUntil >= 0 && 
    occasion.daysUntil <= 30
  );
}

// Get the most urgent occasion (closest to today)
export function getMostUrgentOccasion(): Occasion | null {
  const activeOccasions = getActiveOccasions();
  if (activeOccasions.length === 0) return null;
  
  return activeOccasions.reduce((closest, current) => 
    current.daysUntil < closest.daysUntil ? current : closest
  );
}
