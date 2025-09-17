import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/financial';
import { IncomeChartData } from '../../types/database';

interface IncomeChart3DProps {
  data: IncomeChartData;
  width?: number;
  height?: number;
  className?: string;
}

export function IncomeChart3D({ 
  data, 
  width = 400, 
  height = 400, 
  className = '' 
}: IncomeChart3DProps) {
  const chartData = useMemo(() => {
    const total = data.pending.total + data.paid.total;
    if (total === 0) return [];

    return [
      {
        label: 'Pendiente',
        value: data.pending.total,
        percentage: (data.pending.total / total) * 100,
        color: '#EF4444',
        subtotal: data.pending.subtotal,
        vat: data.pending.vat
      },
      {
        label: 'Pagado',
        value: data.paid.total,
        percentage: (data.paid.total / total) * 100,
        color: '#10B981',
        subtotal: data.paid.subtotal,
        vat: data.paid.vat
      }
    ].filter(item => item.value > 0);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No hay datos de ingresos disponibles</p>
        </div>
      </div>
    );
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;

  // Create pie slices
  let currentAngle = -90; // Start from top
  const slices = chartData.map((item, index) => {
    const angleSpan = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    
    // Calculate path for 3D effect
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = angleSpan > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    // 3D shadow path (offset)
    const shadowOffset = 8;
    const shadowPath = [
      `M ${centerX + shadowOffset} ${centerY + shadowOffset}`,
      `L ${x1 + shadowOffset} ${y1 + shadowOffset}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2 + shadowOffset} ${y2 + shadowOffset}`,
      'Z'
    ].join(' ');

    currentAngle = endAngle;
    
    return {
      ...item,
      pathData,
      shadowPath,
      startAngle,
      endAngle,
      midAngle: startAngle + angleSpan / 2
    };
  });

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Distribución de Ingresos</h3>
        <div className="text-sm text-gray-500">Pie 3D</div>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
        {/* 3D Pie Chart */}
        <div className="relative flex-shrink-0">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-lg">
            {/* Shadow layer */}
            {slices.map((slice, index) => (
              <path
                key={`shadow-${index}`}
                d={slice.shadowPath}
                fill="rgba(0, 0, 0, 0.2)"
                className="opacity-50"
              />
            ))}
            
            {/* Main slices with gradient */}
            {slices.map((slice, index) => (
              <g key={index}>
                <defs>
                  <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={slice.color} />
                    <stop offset="50%" stopColor={slice.color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={slice.color} stopOpacity="0.7" />
                  </linearGradient>
                  <filter id={`glow-${index}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d={slice.pathData}
                  fill={`url(#gradient-${index})`}
                  stroke="white"
                  strokeWidth="2"
                  filter={`url(#glow-${index})`}
                  className="hover:opacity-90 transition-opacity cursor-pointer"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Legend and Details */}
        <div className="flex-1 space-y-4 min-w-0">
          {slices.map((slice, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-medium text-gray-900">{slice.label}</span>
                </div>
                <span className="text-sm text-gray-500">{slice.percentage.toFixed(1)}%</span>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(slice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (16%):</span>
                  <span className="font-medium">{formatCurrency(slice.vat)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-lg" style={{ color: slice.color }}>
                    {formatCurrency(slice.value)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-900">Total General:</span>
              <span className="font-bold text-xl text-blue-900">
                {formatCurrency(data.pending.total + data.paid.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomeChart3D;