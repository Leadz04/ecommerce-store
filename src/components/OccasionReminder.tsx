'use client';

import { useState, useEffect } from 'react';
import OccasionCard from './OccasionCard';

interface Occasion {
  id: string;
  name: string;
  description: string;
  date: Date | string;
  daysUntil: number;
  orderByDate: Date | string;
  urgency: 'today' | 'urgent' | 'medium' | 'low';
  isActive: boolean;
  image: string;
  link: string;
}

export default function OccasionReminder() {
  const [currentOccasion, setCurrentOccasion] = useState<Occasion | null>(null);

  useEffect(() => {
    const fetchMostUrgentOccasion = async () => {
      try {
        const response = await fetch('/api/occasions');
        if (!response.ok) return;
        
        const data = await response.json();
        const mostUrgent = data.mostUrgent;
        
        if (!mostUrgent) {
          setCurrentOccasion(null);
          return;
        }

        // Check if this occasion has been dismissed
        const dismissedOccasions = localStorage.getItem('dismissedOccasions');
        const dismissedList = dismissedOccasions ? JSON.parse(dismissedOccasions) : [];
        
        // Only show if not dismissed and within 14 days
        if (!dismissedList.includes(mostUrgent.id) && mostUrgent.daysUntil <= 14) {
          setCurrentOccasion(mostUrgent);
        } else {
          setCurrentOccasion(null);
        }
      } catch (error) {
        console.error('Error fetching occasions:', error);
        setCurrentOccasion(null);
      }
    };

    fetchMostUrgentOccasion();
  }, []);

  const handleDismiss = (occasionId: string) => {
    const dismissedOccasions = localStorage.getItem('dismissedOccasions');
    const dismissedList = dismissedOccasions ? JSON.parse(dismissedOccasions) : [];
    
    dismissedList.push(occasionId);
    localStorage.setItem('dismissedOccasions', JSON.stringify(dismissedList));
    
    setCurrentOccasion(null);
  };

  if (!currentOccasion) {
    return null;
  }

  return (
    <OccasionCard
      occasion={currentOccasion}
      onDismiss={handleDismiss}
      variant="banner"
    />
  );
}
