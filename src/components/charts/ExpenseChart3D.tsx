import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/financial';
import { ExpenseChartData } from '../../types/database';

interface ExpenseChart3DProps {
  data: ExpenseChartData[];
  width?: number;
  height?: number;
  className?: string;
}

export function ExpenseChart3D({ 
  data, 
  width = 400, 
  height = 400, 
  className = '' 
}: ExpenseChart3DProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.total, 0);
    
    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.total / total) * 100 : 0,
      color: [
        '#3B82F6', // Blue - SPs
        '#EF4444', // Red - Combustible/Peaje
        '#10B981', // Green - RH
        '#F59E0B', // Yellow - Materiales
        '#8B5CF6'  // Purple - Provisiones
      ][index % 5]
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No hay datos de gastos disponibles</p>
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
    
    // Calculate path for pie slice
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

    // Calculate label position
    const midAngle = startAngle + angleSpan / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + labelRadius * Math.cos((midAngle * Math.PI) / 180);
    const labelY = centerY + labelRadius * Math.sin((midAngle * Math.PI) / 180);

    currentAngle = endAngle;
    
    return {
      ...item,
      pathData,
      labelX,
      labelY,
      startAngle,
      endAngle,
      midAngle
    };
  });

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Gastos por Categoría</h3>
        <div className="text-sm text-gray-500">Pie 3D</div>
      </div>
      
      <div className="flex flex-col space-y-6">
        {/* 3D Pie Chart */}
        <div className="relative">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-xl">
            <defs>
              {chartData.map((_, index) => (
                <React.Fragment key={index}>
                  <radialGradient id={`pieGradient-${index}`} cx="30%" cy="30%">
                    <stop offset="0%" stopColor={chartData[index].color} stopOpacity="1" />
                    <stop offset="70%" stopColor={chartData[index].color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={chartData[index].color} stopOpacity="0.6" />
                  </radialGradient>
                  <filter id={`pieShadow-${index}`}>
                    <feDropShadow dx="3" dy="5" stdDeviation="4" floodOpacity="0.3"/>
                  </filter>
                </React.Fragment>
              ))}
            </defs>
            
            {/* Shadow layer for 3D effect */}
            {slices.map((slice, index) => (
              <path
                key={`shadow-${index}`}
                d={slice.pathData}
                fill="rgba(0, 0, 0, 0.2)"
                transform="translate(6, 6)"
                className="opacity-60"
              />
            ))}
            
            {/* Main pie slices */}
            {slices.map((slice, index) => (
              <g key={index}>
                <path
                  d={slice.pathData}
                  fill={`url(#pieGradient-${index})`}
                  stroke="white"
                  strokeWidth="3"
                  filter={`url(#pieShadow-${index})`}
                  className="hover:opacity-90 transition-all duration-300 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`${slice.category}: ${formatCurrency(slice.total)} (${slice.percentage.toFixed(1)}%)`}
                />
                
                {/* Percentage labels on slices */}
                {slice.percentage > 5 && ( // Only show label if slice is large enough
                  <text
                    x={slice.labelX}
                    y={slice.labelY}
                    textAnchor="middle"
                    className="text-sm font-bold fill-white pointer-events-none"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                  >
                    {slice.percentage.toFixed(1)}%
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Legend and detailed breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chartData.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-gray-900">{item.category}</span>
                <span className="text-sm text-gray-500">({item.percentage.toFixed(1)}%)</span>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (16%):</span>
                  <span className="font-medium">{formatCurrency(item.vat)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold" style={{ color: item.color }}>
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ExpenseChart3D;