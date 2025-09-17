import React from 'react';
import { useConnectionMonitor } from '../../utils/connectionValidator';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface ConnectionIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function ConnectionIndicator({ 
  className = '', 
  showDetails = false 
}: ConnectionIndicatorProps) {
  const { status, isHealthy, latency, forceCheck } = useConnectionMonitor();

  const getStatusColor = () => {
    if (isHealthy) {
      if (latency < 500) return 'text-green-500';
      if (latency < 1000) return 'text-yellow-500';
      return 'text-orange-500';
    }
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (isHealthy) {
      if (latency < 500) return 'Excelente';
      if (latency < 1000) return 'Buena';
      return 'Lenta';
    }
    return 'Desconectado';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={forceCheck}
        className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors hover:bg-gray-100 ${getStatusColor()}`}
        title={`Conexión: ${getStatusText()} (${latency}ms)`}
      >
        {isHealthy ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        
        {showDetails && (
          <span className="text-xs font-medium">
            {getStatusText()}
          </span>
        )}
      </button>

      {showDetails && (
        <div className="text-xs text-gray-500 flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{latency}ms</span>
        </div>
      )}
    </div>
  );
}