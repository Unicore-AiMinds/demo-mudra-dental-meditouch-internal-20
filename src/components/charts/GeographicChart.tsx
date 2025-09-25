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
import { MapPin } from "lucide-react";
import { useClinic } from "@/contexts/ClinicContext";
import { sortByValue } from "@/utils/reportsUtils";

interface GeographicChartProps {
  data: Record<string, number>;
  insight: string;
  isLoading?: boolean;
}

const GeographicChart: React.FC<GeographicChartProps> = ({ data, insight, isLoading }) => {
  const { activeClinic } = useClinic();

  // Convert data to chart format and sort by count
  const chartData = sortByValue(data)
    .slice(0, 8) // Show top 8 areas only
    .map(([area, count]) => ({
      area: area.length > 15 ? `${area.substring(0, 15)}...` : area, // Truncate long names
      fullArea: area,
      count,
    }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Patient Geographic Distribution
          </CardTitle>
          <CardDescription>Loading patient location data...</CardDescription>
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
            <MapPin className="h-5 w-5 mr-2" />
            Patient Geographic Distribution
          </CardTitle>
          <CardDescription>Patient distribution by pincode/area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">No patient location data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.fullArea}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} patient{data.count !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className={`h-5 w-5 mr-2 ${activeClinic === 'dental' ? 'text-dental-primary' : 'text-meditouch-primary'}`} />
          Patient Geographic Distribution
        </CardTitle>
        <CardDescription>
          {insight}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="area"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              fill={activeClinic === 'dental' ? '#4A90E2' : '#6CBFBF'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Additional insights */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Total Areas</div>
            <div className="text-lg font-semibold">{Object.keys(data).length}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Total Patients</div>
            <div className="text-lg font-semibold">
              {Object.values(data).reduce((sum, count) => sum + count, 0)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeographicChart;