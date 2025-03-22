import React from 'react';
import {
  Cloud,
  RefreshCw,
  Thermometer,
  Droplets,
  Sun,
  Moon,
} from 'lucide-react';
import { useWeather } from '../contexts/WeatherContext';

export function WeatherCast() {
  const { current, forecast, loading, error, refreshWeather } = useWeather();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Cloud className='w-8 h-8 text-blue-500 animate-pulse' />
      </div>
    );
  }

  if (error || !current || !forecast) {
    return (
      <div className='flex flex-col items-center justify-center h-full text-red-500'>
        <p>{error || 'No weather data available'}</p>
        <button
          onClick={refreshWeather}
          className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='font-bold h-full flex flex-col p-3 bg-gradient-to-br from-blue-50 to-blue-100'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold text-gray-700 flex items-center'>
          <Cloud className='w-6 h-6 mr-2' />
          Clima
        </h2>
        <div className='flex items-center space-x-2'>
          <span className='text-xs text-gray-500'>
            {formatTime(current.LocalObservationDateTime)}
          </span>
          <button
            onClick={refreshWeather}
            className='p-2 text-gray-500 hover:text-gray-700'
            title='Refresh weather'
          >
            <RefreshCw className='w-4 h-4' />
          </button>
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        {/* Current Conditions */}
        <div className='bg-white rounded-lg p-4 shadow-sm'>
          <h3 className='text-sm font-medium text-gray-700 mb-3'>
            Condición actual
          </h3>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Thermometer className='w-5 h-5 text-gray-500' />
              <span className='text-2xl font-bold'>
                {current.Temperature.Metric.Value}°
                {current.Temperature.Metric.Unit}
              </span>
              <span className='text-2xl font-bold'>
                (ST {current.RealFeelTemperature.Metric.Value}°
                {current.RealFeelTemperature.Metric.Unit})
              </span>
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium text-gray-900'>
                {current.WeatherText}
              </p>
              <p className='text-xs text-gray-500'>
                Humedad: {current.RelativeHumidity}%
              </p>
            </div>
          </div>
        </div>

        {/* Daily Forecast */}
        <div className='bg-white rounded-lg p-4 shadow-sm'>
          <h3 className='text-sm font-medium text-gray-700 mb-3'>Clima</h3>

          <div className='space-y-3'>
            {/* Temperature Range */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Thermometer className='w-4 h-4 text-blue-500' />
                <span className='text-sm text-gray-600'>Temperaturas</span>
              </div>
              <div className='text-right'>
                <span className='text-sm font-medium text-blue-600'>
                  {forecast.Temperature.Minimum.Value}° -{' '}
                  {forecast.Temperature.Maximum.Value}°
                </span>
              </div>
            </div>

            {/* Day Conditions */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Sun className='w-4 h-4 text-yellow-500' />
                <span className='text-sm text-gray-600'>Día</span>
              </div>
              <div className='text-right'>
                <span className='text-sm font-medium text-gray-700'>
                  {forecast.Day.IconPhrase}
                </span>
              </div>
            </div>

            {/* Night Conditions */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Moon className='w-4 h-4 text-indigo-500' />
                <span className='text-sm text-gray-600'>Noche</span>
              </div>
              <div className='text-right'>
                <span className='text-sm font-medium text-gray-700'>
                  {forecast.Night.IconPhrase}
                </span>
              </div>
            </div>

            {/* Precipitation */}
            {(forecast.Day.HasPrecipitation ||
              forecast.Night.HasPrecipitation) && (
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Droplets className='w-4 h-4 text-blue-500' />
                  <span className='text-sm text-gray-600'>Precipitación</span>
                </div>
                <div className='text-right text-sm'>
                  {forecast.Day.HasPrecipitation && (
                    <p className='text-blue-600'>
                      Día: {forecast.Day.PrecipitationType} (
                      {forecast.Day.PrecipitationIntensity})
                    </p>
                  )}
                  {forecast.Night.HasPrecipitation && (
                    <p className='text-blue-600'>
                      Noche: {forecast.Night.PrecipitationType} (
                      {forecast.Night.PrecipitationIntensity})
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
