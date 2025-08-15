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
        <div className="bg-white p-2 border border-gray-300 rounded-md shadow-md">
          <p className="font-bold">{label}</p>
          <p>Total Applications: {item?.total_applications}</p>
          <p>Interviews: {item?.interviews}</p>
          <p>Offers: {item?.offers}</p>
          <p>Interview Rate: {payload[0]?.value.toFixed(1)}%</p>
          <p>Offer Rate: {payload[1]?.value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="source" />
        <YAxis label={{ value: 'Rate (%) ', angle: -90, position: 'insideLeft' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="interviewRate" fill="#8884d8" name="Interview Rate" />
        <Bar dataKey="offerRate" fill="#82ca9d" name="Offer Rate" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SuccessBySourceChart;
