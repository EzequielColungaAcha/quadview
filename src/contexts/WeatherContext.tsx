import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { proxyUrl } from '../utils/ProxyUrl';

interface CurrentConditions {
  LocalObservationDateTime: string;
  WeatherText: string;
  WeatherIcon: number;
  Temperature: {
    Metric: {
      Value: number;
      Unit: string;
    };
  };
  RealFeelTemperature: {
    Metric: {
      Value: number;
      Unit: string;
    };
  };
  RelativeHumidity: number;
}

interface DailyForecast {
  Date: string;
  Temperature: {
    Minimum: {
      Value: number;
      Unit: string;
    };
    Maximum: {
      Value: number;
      Unit: string;
    };
  };
  Day: {
    IconPhrase: string;
    Icon: number;
    HasPrecipitation: boolean;
    PrecipitationType: string | null;
    PrecipitationIntensity: string | null;
  };
  Night: {
    IconPhrase: string;
    Icon: number;
    HasPrecipitation: boolean;
    PrecipitationType: string | null;
    PrecipitationIntensity: string | null;
  };
}

interface WeatherContextType {
  current: CurrentConditions | null;
  forecast: DailyForecast | null;
  loading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | null>(null);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<CurrentConditions | null>(null);
  const [forecast, setForecast] = useState<DailyForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const response = await axios.get(proxyUrl + 'weather');
      const { current: currentData, forecast: forecastData } = response.data;
      
      setCurrent(currentData);
      setForecast(forecastData);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch weather data: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000); // Refresh every 30 minutes
    return () => clearInterval(interval);
  }, []);

  const value = {
    current,
    forecast,
    loading,
    error,
    refreshWeather: fetchWeather,
  };

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}