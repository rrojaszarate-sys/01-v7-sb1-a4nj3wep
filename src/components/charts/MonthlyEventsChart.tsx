import React, { useMemo } from 'react';

interface MonthlyEventsData {
  month: string;
  year: number;
  eventCount: number;
  monthName: string;
}

interface MonthlyEventsChartProps {
  data: MonthlyEventsData[];
  width?: number;
  height?: number;
  className?: string;
}

export function MonthlyEventsChart({ 
  data, 
  width = 600, 
  height = 400, 
  className = '' 
}: MonthlyEventsChartProps) {
  const chartData = useMemo(() => {
    // Ensure we have exactly 12 months of data
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    const currentDate = new Date();
    const last12Months: MonthlyEventsData[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existingData = data.find(d => d.month === monthKey);
      
      last12Months.push({
        month: monthKey,
        year: date.getFullYear(),
        eventCount: existingData?.eventCount || 0,
        monthName: months[date.getMonth()]
      });
    }
    
    return last12Months;
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No hay datos de eventos disponibles</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map(item => item.eventCount), 1);
  const barWidth = (width - 120) / chartData.length - 10;
  const maxBarHeight = height - 120;
  const chartStartX = 60;
  const chartStartY = height - 60;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Número de Eventos Mensual</h3>
        <div className="text-sm text-gray-500">Últimos 12 meses</div>
      </div>
      
      <div className="space-y-6">
        {/* 3D Bar Chart */}
        <div className="relative">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-lg">
            {/* Grid lines */}
            <defs>
              <pattern id="monthlyGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
              </pattern>
              <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <filter id="barShadow">
                <feDropShadow dx="4" dy="6" stdDeviation="3" floodOpacity="0.3"/>
              </filter>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#monthlyGrid)" />
            
            {/* Y-axis */}
            <line
              x1={chartStartX}
              y1="40"
              x2={chartStartX}
              y2={chartStartY}
              stroke="#6B7280"
              strokeWidth="2"
            />
            
            {/* X-axis */}
            <line
              x1={chartStartX}
              y1={chartStartY}
              x2={width - 20}
              y2={chartStartY}
              stroke="#6B7280"
              strokeWidth="2"
            />
            
            {/* Y-axis labels */}
            {[0, Math.ceil(maxValue * 0.25), Math.ceil(maxValue * 0.5), Math.ceil(maxValue * 0.75), maxValue].map((value) => {
              const y = chartStartY - (value / maxValue) * maxBarHeight;
              return (
                <g key={value}>
                  <line
                    x1={chartStartX - 5}
                    y1={y}
                    x2={chartStartX}
                    y2={y}
                    stroke="#6B7280"
                    strokeWidth="1"
                  />
                  <text
                    x={chartStartX - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-500"
                  >
                    {value}
                  </text>
                </g>
              );
            })}
            
            {/* Bars with 3D effect */}
            {chartData.map((item, index) => {
              const barHeight = (item.eventCount / maxValue) * maxBarHeight;
              const x = chartStartX + 20 + index * (barWidth + 10);
              const y = chartStartY - barHeight;
              
              // 3D effect parameters
              const depth = 12;
              const shadowOffset = 6;
              
              return (
                <g key={index}>
                  {/* Shadow */}
                  <rect
                    x={x + shadowOffset}
                    y={y + shadowOffset}
                    width={barWidth}
                    height={barHeight}
                    fill="rgba(0, 0, 0, 0.2)"
                    rx="4"
                  />
                  
                  {/* 3D side face */}
                  <polygon
                    points={`${x + barWidth},${y} ${x + barWidth + depth},${y - depth} ${x + barWidth + depth},${chartStartY - depth} ${x + barWidth},${chartStartY}`}
                    fill="#1D4ED8"
                    opacity="0.7"
                  />
                  
                  {/* 3D top face */}
                  <polygon
                    points={`${x},${y} ${x + depth},${y - depth} ${x + barWidth + depth},${y - depth} ${x + barWidth},${y}`}
                    fill="#2563EB"
                    opacity="0.9"
                  />
                  
                  {/* Main bar face */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="url(#barGradient)"
                    filter="url(#barShadow)"
                    rx="4"
                    className="hover:opacity-90 transition-opacity cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.monthName} ${item.year}: ${item.eventCount} eventos`}
                  />
                  
                  {/* Value label above bar */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-xs font-bold fill-gray-700"
                  >
                    {item.eventCount}
                  </text>
                  
                  {/* Month label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartStartY + 15}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-600"
                  >
                    {item.monthName}
                  </text>
                  
                  {/* Year label (only show when year changes) */}
                  {(index === 0 || item.year !== chartData[index - 1]?.year) && (
                    <text
                      x={x + barWidth / 2}
                      y={chartStartY + 30}
                      textAnchor="middle"
                      className="text-xs font-medium fill-gray-500"
                    >
                      {item.year}
                    </text>
                  )}
                </g>
              );
            })}
            
            {/* Chart title */}
            <text
              x={width / 2}
              y="25"
              textAnchor="middle"
              className="text-sm font-semibold fill-gray-700"
            >
              Distribución de Eventos por Mes
            </text>
          </svg>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {chartData.reduce((sum, item) => sum + item.eventCount, 0)}
            </div>
            <div className="text-sm text-blue-700">Total Eventos</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(chartData.reduce((sum, item) => sum + item.eventCount, 0) / 12)}
            </div>
            <div className="text-sm text-green-700">Promedio Mensual</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.max(...chartData.map(item => item.eventCount))}
            </div>
            <div className="text-sm text-purple-700">Mes Pico</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {chartData.find(item => item.eventCount === Math.max(...chartData.map(i => i.eventCount)))?.monthName || 'N/A'}
            </div>
            <div className="text-sm text-orange-700">Mejor Mes</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyEventsChart;