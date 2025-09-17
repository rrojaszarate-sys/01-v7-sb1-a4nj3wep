import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event, Client } from '../types/database';
import { Search, Filter, Eye, Calendar } from 'lucide-react';

interface BillingMasterProps {
  onViewEvent: (eventId: number) => void;
}

export function BillingMaster({ onViewEvent }: BillingMasterProps) {
  const [events, setEvents] = useState<(Event & { client?: Client })[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<(Event & { client?: Client })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [monthYearFilter, setMonthYearFilter] = useState<string>('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter, monthYearFilter]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          client:clients(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.clave_evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.client?.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.client?.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(event => event.status_pago === statusFilter);
    }

    if (monthYearFilter) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.created_at!);
        const eventYear = eventDate.getFullYear();
        const eventMonth = eventDate.getMonth() + 1; // JavaScript months are 0-indexed
        const eventMonthYear = `${eventYear}-${String(eventMonth).padStart(2, '0')}`;
        return eventMonthYear === monthYearFilter;
      });
    }
    
    setFilteredEvents(filtered);
  };

  // Get unique month-year combinations from events data
  const getAvailableMonthYears = () => {
    const monthYears = events.map(event => {
      const eventDate = new Date(event.created_at!);
      const year = eventDate.getFullYear();
      const month = eventDate.getMonth() + 1;
      return {
        value: `${year}-${String(month).padStart(2, '0')}`,
        year,
        month,
        label: `${getMonthName(month)} ${year}`
      };
    });
    
    // Remove duplicates and sort by date (most recent first)
    const uniqueMonthYears = monthYears.filter((item, index, self) => 
      index === self.findIndex(t => t.value === item.value)
    );
    
    return uniqueMonthYears.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year; // Sort by year descending
      return b.month - a.month; // Then by month descending
    });
  };

  // Helper function to get month name in Spanish
  const getMonthName = (month: number): string => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[month - 1] || '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pagado':
        return 'bg-green-100 text-green-800';
      case 'Pago Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pendiente Facturar':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Master de Facturación</h1>
        <button
          onClick={fetchEvents}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por clave, proyecto o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="Pagado">Pagado</option>
              <option value="Pago Pendiente">Pago Pendiente</option>
              <option value="Pendiente Facturar">Pendiente Facturar</option>
            </select>
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={monthYearFilter}
              onChange={(e) => setMonthYearFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los períodos</option>
              {getAvailableMonthYears().map(monthYear => (
                <option key={monthYear.value} value={monthYear.value}>
                  {monthYear.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-500 flex items-center justify-center">
            {filteredEvents.length} de {events.length} eventos
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clave Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {event.clave_evento}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.nombre_proyecto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.client?.nombre_comercial || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(event.created_at!)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(event.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status_pago)}`}>
                        {event.status_pago}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewEvent(event.id)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium mb-2">No se encontraron eventos</p>
            <p className="text-sm">
              {searchTerm || statusFilter || monthYearFilter
                ? 'No hay eventos que coincidan con los filtros aplicados.'
                : 'No hay eventos registrados en el sistema.'
              }
            </p>
            {(searchTerm || statusFilter || monthYearFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setMonthYearFilter('');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}