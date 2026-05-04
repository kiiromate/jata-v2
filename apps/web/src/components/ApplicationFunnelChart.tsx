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

interface FunnelDataPoint {
  value: number;
  name: string;
  fill: string;
  rate: number | null;
}

interface FunnelLabelProps {
  x?: number;
  y?: number;
  value?: number;
  name?: string;
  index?: number;
  rate?: number | null;
}

interface FunnelTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: FunnelDataPoint }>;
}

/**
 * Renders the funnel chart for applications, interviews, and offers.
 */
const ApplicationFunnelChart: React.FC<ApplicationFunnelChartProps> = ({ data }) => {
  const { total_applications, interviews, offers } = data;

  const interviewRate = total_applications > 0 ? (interviews / total_applications) * 100 : 0;
  const offerRate = interviews > 0 ? (offers / interviews) * 100 : 0;

  const funnelData: FunnelDataPoint[] = [
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

  /**
   * Renders custom funnel labels and conversion percentages.
   */
  const renderCustomLabel = (props: any) => {
    const { x, y, value, name, index, rate } = props;
    if (x === undefined || y === undefined || value === undefined || !name) {
      return null;
    }

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

  /**
   * Renders tooltip details for the hovered funnel stage.
   */
  const renderCustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length > 0) {
      const tooltipData = payload[0].payload;
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold mb-1">{tooltipData.name}</p>
          <p className="text-sm">Count: {tooltipData.value}</p>
          {tooltipData.rate !== null && (
            <p className="text-sm text-muted-foreground mt-1">
              Conversion: {tooltipData.rate.toFixed(1)}%
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
        <Tooltip content={renderCustomTooltip} />
        <Funnel
          dataKey="value"
          data={funnelData}
          isAnimationActive
          animationDuration={800}
          animationBegin={200}
          labelLine={false}
          lastShapeType="rectangle"
        >
          <LabelList dataKey="name" position="right" stroke="none" content={renderCustomLabel} />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
};

export default ApplicationFunnelChart;
