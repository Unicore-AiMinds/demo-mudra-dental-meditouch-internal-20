import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';

interface GenderDistributionChartProps {
  data: Record<string, number>;
  insight: string;
  isLoading?: boolean;
}

const GenderDistributionChart: React.FC<GenderDistributionChartProps> = ({
  data,
  insight,
  isLoading
}) => {
  const { activeClinic } = useClinic();

  // Convert data to chart format
  const chartData = Object.entries(data).map(([gender, count]) => ({
    name: gender,
    value: count,
  })).filter(item => item.value > 0);

  // Gender colors - more robust mapping
  const getColorForGender = (gender: string) => {
    const genderLower = gender.toLowerCase().trim();

    // Female variations (check first since "female" contains "male")
    if (genderLower.includes('female') || genderLower === 'f') {
      return '#EC4899'; // Pink
    }

    // Male variations
    if (genderLower.includes('male') || genderLower === 'm') {
      return '#3B82F6'; // Blue
    }

    // Other/Non-binary variations
    if (genderLower.includes('other') || genderLower.includes('non-binary') || genderLower.includes('prefer not')) {
      return '#8B5CF6'; // Purple
    }

    // Default for unknown/not specified
    return '#6B7280'; // Gray
  };

  const totalPatients = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gender Distribution
          </CardTitle>
          <CardDescription>Loading gender distribution data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalPatients === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gender Distribution
          </CardTitle>
          <CardDescription>Patient distribution by gender</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">No patient data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = totalPatients > 0 ? ((data.value / totalPatients) * 100).toFixed(1) : 0;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} patient{data.value !== 1 ? 's' : ''} ({percentage}%)
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
          <Users className={`h-5 w-5 mr-2 ${activeClinic === 'dental' ? 'text-dental-primary' : 'text-meditouch-primary'}`} />
          Gender Distribution
        </CardTitle>
        <CardDescription>
          {insight}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColorForGender(entry.name)}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Gender breakdown */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {chartData.map((item) => {
            const percentage = totalPatients > 0 ? ((item.value / totalPatients) * 100).toFixed(1) : 0;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-6 rounded-lg border bg-gradient-to-r from-gray-50 to-white"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getColorForGender(item.name) }}
                  />
                  <span className="text-base font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{item.value}</div>
                  <div className="text-sm text-muted-foreground">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>

      </CardContent>
    </Card>
  );
};

export default GenderDistributionChart;