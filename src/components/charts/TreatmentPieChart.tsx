import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useClinic } from "@/contexts/ClinicContext";
import { sortByValue, calculatePercentage } from "@/utils/reportsUtils";

interface TreatmentPieChartProps {
  data: Record<string, number>;
  insight: string;
  total: number;
  isLoading?: boolean;
}

// Color palette for pie chart
const COLORS = [
  '#4A90E2', // Blue
  '#6CBFBF', // Teal
  '#82ca9d', // Light green
  '#FFBB28', // Yellow
  '#FF8042', // Orange
  '#8884d8', // Purple
  '#82b1ff', // Light blue
  '#ff9999'  // Light red
];

const TreatmentPieChart: React.FC<TreatmentPieChartProps> = ({
  data,
  insight,
  total,
  isLoading
}) => {
  const { activeClinic } = useClinic();

  // Convert data to chart format
  const chartData = sortByValue(data)
    .slice(0, 6) // Show top 6 treatments
    .map(([treatment, count], index) => ({
      name: treatment.length > 20 ? `${treatment.substring(0, 20)}...` : treatment,
      fullName: treatment,
      value: count,
      percentage: calculatePercentage(count, total),
      fill: COLORS[index % COLORS.length]
    }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Treatment Distribution
          </CardTitle>
          <CardDescription>Loading treatment data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Treatment Distribution
          </CardTitle>
          <CardDescription>Distribution of completed treatments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">No treatment data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.payload.fullName}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} treatment{data.value !== 1 ? 's' : ''} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ name, percentage }: any) => {
    return `${percentage}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className={`h-5 w-5 mr-2 ${activeClinic === 'dental' ? 'text-dental-primary' : 'text-meditouch-primary'}`} />
          Treatment Distribution
        </CardTitle>
        <CardDescription>
          {insight}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center">
          {/* Pie Chart */}
          <div className="w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend and Stats */}
          <div className="w-full lg:w-1/2 lg:pl-6">
            <div className="space-y-3">
              <div className="font-medium text-sm text-muted-foreground">Treatment Breakdown</div>
              {chartData.map((item, index) => (
                <div key={item.fullName} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="text-sm font-medium">
                    {item.value} ({item.percentage}%)
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Total Treatments</span>
                <span className="text-lg font-semibold">{total}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentPieChart;