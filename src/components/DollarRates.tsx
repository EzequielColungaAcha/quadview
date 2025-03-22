import React, { useEffect, useState } from 'react';
import { DollarSign, RefreshCw } from 'lucide-react';
import { proxyUrl } from '../utils/ProxyUrl';
import axios from 'axios';

interface DollarRate {
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const ALLOWED_TYPES = ['Oficial', 'Blue', 'Cripto', 'Bolsa', 'Tarjeta'];

export function DollarRates() {
  const [rates, setRates] = useState<DollarRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(proxyUrl + 'dollar-rates');
      const filteredRates = response.data.filter((rate: DollarRate) =>
        ALLOWED_TYPES.includes(rate.nombre)
      );
      setRates(filteredRates);
      setLastFetchTime(new Date());
      setError(null);
    } catch (err) {
      setError(`Failed to fetch dollar rates: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 1800000); // Refresh every 30 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <RefreshCw className='w-8 h-8 text-blue-500 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='h-full flex flex-col items-center justify-center text-red-500'>
        <p>{error}</p>
        <button
          onClick={fetchRates}
          className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='h-full font-bold flex flex-col p-4 bg-gradient-to-br from-emerald-50 to-emerald-100'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold text-gray-700 flex items-center'>
          <DollarSign className='w-6 h-6 mr-2' />
          Dólar
        </h2>
        <div className='flex items-center space-x-2'>
          {lastFetchTime && (
            <span className='text-xs text-gray-500'>
              {formatTime(lastFetchTime)}
            </span>
          )}
          <button
            onClick={fetchRates}
            className='p-1 text-gray-500 hover:text-gray-700'
            title='Refresh rates'
          >
            <RefreshCw className='w-4 h-4' />
          </button>
        </div>
      </div>
      <table className='w-full bg-white rounded-lg shadow-sm'>
        <thead>
          <tr className='bg-gray-50 border-b'>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Tipo
            </th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Compra
            </th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Venta
            </th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Actualización
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200'>
          {rates.map((rate) => (
            <tr key={rate.nombre} className='hover:bg-gray-50'>
              <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                {rate.nombre}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900'>
                {formatCurrency(rate.compra)}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900'>
                {formatCurrency(rate.venta)}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500'>
                {formatDate(rate.fechaActualizacion)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
