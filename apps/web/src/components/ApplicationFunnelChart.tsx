import React from 'react';
import {
  FunnelChart,
  Funnel,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';

interface ApplicationFunnelChartProps {
  data: {
    total_applications: number;
    interviews: number;
    offers: number;
  };
}

const ApplicationFunnelChart: React.FC<ApplicationFunnelChartProps> = ({ data }) => {
  const { total_applications, interviews, offers } = data;

  const interviewRate = total_applications > 0 ? (interviews / total_applications) * 100 : 0;
  const offerRate = interviews > 0 ? (offers / interviews) * 100 : 0;

  const funnelData = [
    {
      value: total_applications,
      name: 'Total Applications',
      fill: '#8884d8',
      rate: null, // No rate for the first stage
    },
    {
      value: interviews,
      name: 'Interviews',
      fill: '#82ca9d',
      rate: interviewRate,
    },
    {
      value: offers,
      name: 'Offers',
      fill: '#ffc658',
      rate: offerRate,
    },
  ];

  const CustomLabel = (props: any) => {
    const { x, y, value, name, index, rate } = props;
    return (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {`${name}: ${value}`}
        {index > 0 && rate !== null && ` (${rate.toFixed(1)}%)`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <FunnelChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Tooltip />
        <Funnel
          dataKey="value"
          data={funnelData}
          isAnimationActive
          labelLine={false}
          lastShapeType="rectangle"
        >
          <LabelList dataKey="name" position="right" fill="#000" stroke="none" content={CustomLabel} />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
};

export default ApplicationFunnelChart;
