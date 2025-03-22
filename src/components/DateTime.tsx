import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

export function DateTime() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatDate = (date: Date) => {
    const formatted = date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Split the date string and capitalize the weekday and month
    const parts = formatted.split(', ');
    if (parts.length === 2) {
      const [weekday, rest] = parts;
      const dateParts = rest.split(' de ');
      if (dateParts.length >= 2) {
        const [day, month, ...yearParts] = dateParts;
        const year = yearParts.join(' de ');
        return `${capitalizeFirstLetter(
          weekday
        )}, ${day} de ${capitalizeFirstLetter(month)} de ${year}`;
      }
    }
    return formatted;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className='font-bold h-full bg-gray-50 border-t border-b border-gray-200 flex items-center justify-center px-4'>
      <div className='flex items-center space-x-4'>
        <Calendar className='w-5 h-5 text-gray-500' />
        <div className='text-gray-700'>
          <span>{formatDate(date)}</span>
        </div>
        <Clock className='w-5 h-5 text-gray-500' />
        <div className='text-gray-700'>
          <span>{formatTime(date)}</span>
        </div>
      </div>
    </div>
  );
}
