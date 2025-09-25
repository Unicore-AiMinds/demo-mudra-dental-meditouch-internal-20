import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useClinic } from "@/contexts/ClinicContext";

interface GrowthData {
  months: { month: string; count: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  totalGrowth: number;
}

interface GrowthLineChartProps {
  data: GrowthData;
  isLoading?: boolean;
}

const GrowthLineChart: React.FC<GrowthLineChartProps> = ({
  data,
  isLoading
}) => {
  const { activeClinic } = useClinic();

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'increasing':
        return 'text-green-500';
      case 'decreasing':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendText = () => {
    switch (data.trend) {
      case 'increasing':
        return 'Growing';
      case 'decreasing':
        return 'Declining';
      default:
        return 'Stable';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Patient Growth Trend
          </CardTitle>
          <CardDescription>Loading growth trend data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.months.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Patient Growth Trend
          </CardTitle>
          <CardDescription>New patient registrations over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">No growth data available</div>
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
            {data.value} new patient{data.value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate some additional metrics
  const maxMonth = data.months.reduce((max, month) =>
    month.count > max.count ? month : max, data.months[0]);

  const averagePerMonth = data.totalGrowth / data.months.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className={`h-5 w-5 mr-2 ${activeClinic === 'dental' ? 'text-dental-primary' : 'text-meditouch-primary'}`} />
          Patient Growth Trend
        </CardTitle>
        <CardDescription className="flex items-center">
          {getTrendIcon()}
          <span className={`ml-1 ${getTrendColor()}`}>
            {getTrendText()} trend over the last 6 months
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data.months}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke={activeClinic === 'dental' ? '#4A90E2' : '#6CBFBF'}
              strokeWidth={3}
              dot={{
                fill: activeClinic === 'dental' ? '#4A90E2' : '#6CBFBF',
                strokeWidth: 2,
                r: 6
              }}
              activeDot={{
                r: 8,
                fill: activeClinic === 'dental' ? '#4A90E2' : '#6CBFBF'
              }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Growth statistics */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 rounded-lg border">
            <div className="font-medium text-muted-foreground">Total New Patients</div>
            <div className="text-xl font-semibold mt-1">{data.totalGrowth}</div>
            <div className="text-xs text-muted-foreground mt-1">Last 6 months</div>
          </div>
          <div className="text-center p-3 rounded-lg border">
            <div className="font-medium text-muted-foreground">Monthly Average</div>
            <div className="text-xl font-semibold mt-1">
              {Math.round(averagePerMonth * 10) / 10}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Per month</div>
          </div>
          <div className="text-center p-3 rounded-lg border">
            <div className="font-medium text-muted-foreground">Best Month</div>
            <div className="text-xl font-semibold mt-1">{maxMonth?.count || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {maxMonth?.month || 'N/A'}
            </div>
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-sm font-medium text-muted-foreground mb-3">Monthly Breakdown</div>
          <div className="grid grid-cols-6 gap-2">
            {data.months.map((month, index) => (
              <div
                key={month.month}
                className={`text-center p-2 rounded border ${
                  month.count === maxMonth?.count && maxMonth?.count > 0
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="text-xs text-muted-foreground">
                  {month.month.split(' ')[0]}
                </div>
                <div className="text-sm font-semibold">{month.count}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GrowthLineChart;