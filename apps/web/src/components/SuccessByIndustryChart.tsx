import React from 'react';

interface SuccessByIndustryData {
  industry: string;
  total_applications: number;
  interviews: number;
  offers: number;
}

interface SuccessByIndustryChartProps {
  data: SuccessByIndustryData[];
}

const SuccessByIndustryChart: React.FC<SuccessByIndustryChartProps> = ({ data }) => {
  return (
    <div className="p-4 border rounded-lg">
      <h4 className="text-lg font-semibold mb-2">Industry Success Breakdown</h4>
      {data.length > 0 ? (
        <ul>
          {data.map((item, index) => (
            <li key={index} className="mb-2">
              <p className="font-medium">{item.industry}</p>
              <p className="text-sm text-gray-600">Applications: {item.total_applications}, Interviews: {item.interviews}, Offers: {item.offers}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No industry data available.</p>
      )}
    </div>
  );
};

export default SuccessByIndustryChart;