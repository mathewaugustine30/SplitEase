import React from 'react';

interface ChartDataPoint {
  date: Date;
  value: number;
}

interface LineChartProps {
  data: ChartDataPoint[];
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
    const width = 600;
    const height = 250;

    if (data.length < 2) {
        return (
            <div className="flex items-center justify-center w-full h-full text-gray-500">
                Not enough data to display a chart.
            </div>
        );
    }
    
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => d.value));
    const minDate = data[0].date.getTime();
    const maxDate = data[data.length - 1].date.getTime();

    const xScale = (date: Date) => {
        const time = date.getTime();
        if (maxDate === minDate) return 0;
        return ((time - minDate) / (maxDate - minDate)) * chartWidth;
    };

    const yScale = (value: number) => {
        if (maxVal === 0) return chartHeight;
        return chartHeight - (value / maxVal) * chartHeight;
    };

    const pathData = data.map(d => `${xScale(d.date).toFixed(2)},${yScale(d.value).toFixed(2)}`).join(' L ');
    
    const yAxisTicks = [0, 0.25, 0.5, 0.75, 1].map(tick => maxVal * tick);

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <g transform={`translate(${padding.left}, ${padding.top})`}>
                {yAxisTicks.map(tickValue => (
                    <g key={tickValue} transform={`translate(0, ${yScale(tickValue)})`}>
                        <line x1={0} x2={chartWidth} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="-10" y="4" textAnchor="end" fill="#6b7281" fontSize="10">
                            ${tickValue.toFixed(0)}
                        </text>
                    </g>
                ))}

                <g transform={`translate(0, ${chartHeight})`}>
                    <line x1={0} x2={chartWidth} stroke="#d1d5db" strokeWidth="1" />
                    <text x={xScale(data[0].date)} y="20" textAnchor="start" fill="#6b7281" fontSize="10">
                        {data[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </text>
                    <text x={xScale(data[data.length - 1].date)} y="20" textAnchor="end" fill="#6b7281" fontSize="10">
                        {data[data.length - 1].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </text>
                </g>
                
                <path d={`M ${pathData} L ${xScale(data[data.length - 1].date).toFixed(2)},${chartHeight} L ${xScale(data[0].date).toFixed(2)},${chartHeight} Z`} fill="url(#gradient)" />
                
                <path d={`M ${pathData}`} fill="none" stroke="#1FBC9C" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </g>
            <defs>
                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#1FBC9C" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#1FBC9C" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default LineChart;
