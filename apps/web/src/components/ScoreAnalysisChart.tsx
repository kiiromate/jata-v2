import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CHART_COLORS, getScoreColor } from '@/lib/chartColors';

interface ScoreAnalysisChartProps {
  data: {
    status: string;
    count: number;
    average_score: number;
  }[];
}

const ScoreAnalysisChart: React.FC<ScoreAnalysisChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.status}</p>
          <p className="text-sm">
            Average Score: <span className="font-medium">{data.average_score.toFixed(1)}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Applications: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray[200]} />
        <XAxis
          dataKey="status"
          tick={{ fill: CHART_COLORS.gray[600], fontSize: 12 }}
          axisLine={{ stroke: CHART_COLORS.gray[300] }}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.gray[600], fontSize: 12 }}
          axisLine={{ stroke: CHART_COLORS.gray[300] }}
          label={{
            value: 'Average Score',
            angle: -90,
            position: 'insideLeft',
            style: { fill: CHART_COLORS.gray[600], fontSize: 12 }
          }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: CHART_COLORS.gray[50] }} />
        <Bar
          dataKey="average_score"
          radius={[8, 8, 0, 0]}
          animationDuration={800}
          animationBegin={200}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getScoreColor(entry.average_score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ScoreAnalysisChart;
