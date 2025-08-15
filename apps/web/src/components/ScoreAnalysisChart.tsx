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

interface ScoreAnalysisChartProps {
  data: {
    status: string;
    count: number;
    average_score: number;
  }[];
}

const ScoreAnalysisChart: React.FC<ScoreAnalysisChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="status" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="average_score" fill="#8884d8" name="Average Jata Score" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ScoreAnalysisChart;
