import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/financial';
import { ProfitChartData } from '../../types/database';

interface ProfitChart3DProps {
  data: ProfitChartData;
  width?: number;
  height?: number;
  className?: string;
}

export function ProfitChart3D({ 
  data, 
  width = 400, 
  height = 400, 
  className = '' 
}: ProfitChart3DProps) {
  const chartData = useMemo(() => {
    const total = data.income.amount + data.expenses.amount;
    if (total === 0) return [];

    const segments = [
      {
        label: 'Ingresos',
        value: data.income.amount,
        percentage: data.income.percentage,
        color: '#10B981'
      },
      {
        label: 'Gastos',
        value: data.expenses.amount,
        percentage: data.expenses.percentage,
        color: '#EF4444'
      }
    ];

    // Add profit/loss segment if significant
    if (Math.abs(data.profit.amount) > total * 0.01) { // Only show if > 1% of total
      segments.push({
        label: data.profit.isLoss ? 'Pérdida' : 'Utilidad',
        value: Math.abs(data.profit.amount),
        percentage: Math.abs(data.profit.percentage),
        color: data.profit.isLoss ? '#F59E0B' : '#059669'
      });
    }

    return segments.filter(item => item.value > 0);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No hay datos de rentabilidad disponibles</p>
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
    const shadowOffset = 10;
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
        <h3 className="text-lg font-medium text-gray-900">Análisis de Rentabilidad</h3>
        <div className="text-sm text-gray-500">Pie 3D</div>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
        {/* 3D Pie Chart */}
        <div className="relative flex-shrink-0">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-xl">
            {/* Shadow layer */}
            {slices.map((slice, index) => (
              <path
                key={`shadow-${index}`}
                d={slice.shadowPath}
                fill="rgba(0, 0, 0, 0.3)"
                className="opacity-60"
              />
            ))}
            
            {/* Main slices with enhanced 3D effect */}
            {slices.map((slice, index) => (
              <g key={index}>
                <defs>
                  <radialGradient id={`radialGradient-${index}`} cx="30%" cy="30%">
                    <stop offset="0%" stopColor={slice.color} stopOpacity="1" />
                    <stop offset="70%" stopColor={slice.color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={slice.color} stopOpacity="0.6" />
                  </radialGradient>
                  <filter id={`enhance-${index}`}>
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d={slice.pathData}
                  fill={`url(#radialGradient-${index})`}
                  stroke="white"
                  strokeWidth="3"
                  filter={`url(#enhance-${index})`}
                  className="hover:opacity-90 transition-all duration-300 cursor-pointer"
                  style={{
                    filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.2))'
                  }}
                />
              </g>
            ))}
            
            {/* Center content */}
            <circle
              cx={centerX}
              cy={centerY}
              r="60"
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="2"
              className="drop-shadow-md"
            />
            <text
              x={centerX}
              y={centerY - 10}
              textAnchor="middle"
              className={`text-lg font-bold ${data.profit.isLoss ? 'fill-red-600' : 'fill-green-600'}`}
            >
              {data.profit.isLoss ? 'PÉRDIDA' : 'UTILIDAD'}
            </text>
            <text
              x={centerX}
              y={centerY + 15}
              textAnchor="middle"
              className={`text-sm font-semibold ${data.profit.isLoss ? 'fill-red-500' : 'fill-green-500'}`}
            >
              {formatCurrency(Math.abs(data.profit.amount))}
            </text>
          </svg>
        </div>

        {/* Legend and Analysis */}
        <div className="flex-1 space-y-4 min-w-0">
          {slices.map((slice, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-medium text-gray-900">{slice.label}</span>
                </div>
                <span className="text-sm text-gray-500">{slice.percentage.toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monto:</span>
                <span className="font-bold text-lg" style={{ color: slice.color }}>
                  {formatCurrency(slice.value)}
                </span>
              </div>
            </div>
          ))}
          
          {/* Profit Analysis Summary */}
          <div className={`rounded-lg p-4 border-2 ${
            data.profit.isLoss 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Ingresos:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(data.income.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Gastos:</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(data.expenses.amount)}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between items-center">
                  <span className={`font-bold text-lg ${
                    data.profit.isLoss ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {data.profit.isLoss ? 'Pérdida Neta:' : 'Utilidad Neta:'}
                  </span>
                  <span className={`font-bold text-xl ${
                    data.profit.isLoss ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {formatCurrency(Math.abs(data.profit.amount))}
                  </span>
                </div>
                <div className="text-center mt-2">
                  <span className={`text-sm font-medium ${
                    data.profit.isLoss ? 'text-red-600' : 'text-green-600'
                  }`}>
                    Margen: {Math.abs(data.profit.percentage).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfitChart3D;