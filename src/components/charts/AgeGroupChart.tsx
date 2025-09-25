import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useClinic } from "@/contexts/ClinicContext";
import { calculatePercentage } from "@/utils/reportsUtils";

interface AgeGroupChartProps {
  data: Record<string, number>;
  insight: string;
  total: number;
  isLoading?: boolean;
}

const AgeGroupChart: React.FC<AgeGroupChartProps> = ({
  data,
  insight,
  total,
  isLoading
}) => {
  const { activeClinic } = useClinic();

  // Define the order of age groups for consistent display
  const ageGroupOrder = ['0-18 years', '19-35 years', '36-50 years', '51+ years'];

  // Convert data to chart format with consistent ordering
  const chartData = ageGroupOrder.map(ageGroup => ({
    ageGroup,
    count: data[ageGroup] || 0,
    percentage: calculatePercentage(data[ageGroup] || 0, total)
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Patient Age Distribution
          </CardTitle>
          <CardDescription>Loading age group data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Patient Age Distribution
          </CardTitle>
          <CardDescription>Patient distribution by age groups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">No patient age data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} patient{data.value !== 1 ? 's' : ''} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Get the dominant age group for highlighting
  const maxCount = Math.max(...chartData.map(item => item.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className={`h-5 w-5 mr-2 ${activeClinic === 'dental' ? 'text-dental-primary' : 'text-meditouch-primary'}`} />
          Patient Age Distribution
        </CardTitle>
        <CardDescription>
          {insight}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ageGroup" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              fill={activeClinic === 'dental' ? '#4A90E2' : '#6CBFBF'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Additional statistics */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {chartData.map((item) => (
            <div
              key={item.ageGroup}
              className={`text-center p-3 rounded-lg border ${
                item.count === maxCount && maxCount > 0
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <div className="text-sm font-medium text-muted-foreground">
                {item.ageGroup}
              </div>
              <div className="text-lg font-semibold mt-1">
                {item.count}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {item.percentage}%
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-medium text-muted-foreground">Total Patients</span>
            <span className="text-lg font-semibold">{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgeGroupChart;