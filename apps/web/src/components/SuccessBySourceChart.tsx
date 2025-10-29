import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/lib/chartColors';

interface SuccessBySourceChartProps {
  data: {
    source: string;
    total_applications: number;
    interviews: number;
    offers: number;
  }[];
}

const SuccessBySourceChart: React.FC<SuccessBySourceChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    ...item,
    interviewRate: item.total_applications > 0 ? (item.interviews / item.total_applications) * 100 : 0,
    offerRate: item.interviews > 0 ? (item.offers / item.interviews) * 100 : 0,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = chartData.find(d => d.source === label);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-700">
              Applications: <span className="font-medium">{item?.total_applications}</span>
            </p>
            <p className="text-sm text-gray-700">
              Interviews: <span className="font-medium">{item?.interviews}</span>
            </p>
            <p className="text-sm text-gray-700">
              Offers: <span className="font-medium">{item?.offers}</span>
            </p>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <p className="text-sm" style={{ color: CHART_COLORS.primary.indigo }}>
                Interview Rate: <span className="font-medium">{payload[0]?.value.toFixed(1)}%</span>
              </p>
              <p className="text-sm" style={{ color: CHART_COLORS.primary.emerald }}>
                Offer Rate: <span className="font-medium">{payload[1]?.value.toFixed(1)}%</span>
              </p>
            </div>
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
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray[200]} />
        <XAxis
          dataKey="source"
          tick={{ fill: CHART_COLORS.gray[600], fontSize: 12 }}
          axisLine={{ stroke: CHART_COLORS.gray[300] }}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.gray[600], fontSize: 12 }}
          axisLine={{ stroke: CHART_COLORS.gray[300] }}
          label={{
            value: 'Rate (%)',
            angle: -90,
            position: 'insideLeft',
            style: { fill: CHART_COLORS.gray[600], fontSize: 12 }
          }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: CHART_COLORS.gray[50] }} />
        <Legend content={<CustomLegend />} />
        <Bar
          dataKey="interviewRate"
          fill={CHART_COLORS.primary.indigo}
          name="Interview Rate"
          radius={[8, 8, 0, 0]}
          animationDuration={800}
          animationBegin={200}
        />
        <Bar
          dataKey="offerRate"
          fill={CHART_COLORS.primary.emerald}
          name="Offer Rate"
          radius={[8, 8, 0, 0]}
          animationDuration={800}
          animationBegin={200}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SuccessBySourceChart;
