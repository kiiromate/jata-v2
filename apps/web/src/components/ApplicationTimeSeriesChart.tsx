import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/lib/chartColors';

interface TimeSeriesDataPoint {
  date: string;
  applications: number;
  interviews: number;
  offers: number;
}

interface ApplicationTimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
}

const ApplicationTimeSeriesChart: React.FC<ApplicationTimeSeriesChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: <span className="font-medium">{entry.value}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-6 mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No time-series data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <defs>
          <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary.indigo} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.primary.indigo} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary.purple} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.primary.purple} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOffers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary.emerald} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.primary.emerald} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray[200]} />
        <XAxis
          dataKey="date"
          tick={{ fill: CHART_COLORS.gray[600], fontSize: 12 }}
          axisLine={{ stroke: CHART_COLORS.gray[300] }}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.gray[600], fontSize: 12 }}
          axisLine={{ stroke: CHART_COLORS.gray[300] }}
          label={{
            value: 'Count',
            angle: -90,
            position: 'insideLeft',
            style: { fill: CHART_COLORS.gray[600], fontSize: 12 }
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        <Area
          type="monotone"
          dataKey="applications"
          stroke={CHART_COLORS.primary.indigo}
          fill="url(#colorApplications)"
          name="Applications"
          strokeWidth={2}
          animationDuration={800}
          animationBegin={200}
        />
        <Area
          type="monotone"
          dataKey="interviews"
          stroke={CHART_COLORS.primary.purple}
          fill="url(#colorInterviews)"
          name="Interviews"
          strokeWidth={2}
          animationDuration={800}
          animationBegin={200}
        />
        <Area
          type="monotone"
          dataKey="offers"
          stroke={CHART_COLORS.primary.emerald}
          fill="url(#colorOffers)"
          name="Offers"
          strokeWidth={2}
          animationDuration={800}
          animationBegin={200}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ApplicationTimeSeriesChart;
