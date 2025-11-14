import React from 'react';

interface DonutChartDataPoint {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartDataPoint[];
}

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
};


const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const size = 250;
  const strokeWidth = 25;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-gray-500">
        No expense data to display.
      </div>
    );
  }

  const total = data.reduce((acc, item) => acc + item.value, 0);

  let accumulatedOffset = 0;
  const segments = data.map(item => {
    const percentage = total > 0 ? item.value / total : 0;
    const dash = percentage * circumference;
    const segment = {
      ...item,
      dash,
      offset: accumulatedOffset,
    };
    accumulatedOffset += dash;
    return segment;
  });

  return (
    <div className="flex flex-col md:flex-row items-center justify-center h-full w-full">
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={-segment.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-gray-500 text-sm">Total</span>
            <span className="text-2xl font-bold text-brand-dark">{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="flex flex-col space-y-2 text-sm max-w-[150px] ml-4 mt-4 md:mt-0">
        {data.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center">
            <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: item.color }}></span>
            <div className="flex justify-between w-full truncate">
                <span className="text-gray-700 truncate" title={item.name}>{item.name}</span>
                <span className="font-semibold text-gray-800 ml-2">
                    {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                </span>
            </div>
          </div>
        ))}
        {data.length > 5 && <div className="text-gray-500 text-xs pl-5">...and {data.length - 5} more</div>}
      </div>
    </div>
  );
};

export default DonutChart;