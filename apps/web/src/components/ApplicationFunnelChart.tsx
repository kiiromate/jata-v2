import React from 'react';
import {
  FunnelChart,
  Funnel,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/lib/chartColors';

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
      fill: CHART_COLORS.primary.indigo,
      rate: null,
    },
    {
      value: interviews,
      name: 'Interviews',
      fill: CHART_COLORS.primary.purple,
      rate: interviewRate,
    },
    {
      value: offers,
      name: 'Offers',
      fill: CHART_COLORS.primary.cyan,
      rate: offerRate,
    },
  ];

  const CustomLabel = (props: any) => {
    const { x, y, value, name, index, rate } = props;
    return (
      <text
        x={x}
        y={y}
        fill={CHART_COLORS.gray[900]}
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-medium"
      >
        <tspan x={x} dy="0" className="font-semibold">
          {name}: {value}
        </tspan>
        {index > 0 && rate !== null && (
          <tspan x={x} dy="20" className="text-sm" fill={CHART_COLORS.gray[600]}>
            ({rate.toFixed(1)}% conversion)
          </tspan>
        )}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold mb-1">{data.name}</p>
          <p className="text-sm">Count: {data.value}</p>
          {data.rate !== null && (
            <p className="text-sm text-muted-foreground mt-1">
              Conversion: {data.rate.toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <FunnelChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Tooltip content={<CustomTooltip />} />
        <Funnel
          dataKey="value"
          data={funnelData}
          isAnimationActive
          animationDuration={800}
          animationBegin={200}
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
