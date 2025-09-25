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
import { Calendar } from "lucide-react";
import { useClinic } from "@/contexts/ClinicContext";

interface WeeklyChartProps {
  data: Record<string, number>;
  insight: string;
  isLoading?: boolean;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({
  data,
  insight,
  isLoading
}) => {
  const { activeClinic } = useClinic();

  // Define the order of days for consistent display
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Convert data to chart format with consistent ordering
  const chartData = dayOrder.map(day => ({
    day: day.substring(0, 3), // Show short form (Mon, Tue, etc.)
    fullDay: day,
    appointments: data[day] || 0,
  }));

  const totalAppointments = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Weekly Appointment Pattern
          </CardTitle>
          <CardDescription>Loading weekly appointment data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalAppointments === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Weekly Appointment Pattern
          </CardTitle>
          <CardDescription>Appointment distribution by day of the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">No appointment data available</div>
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
          <p className="font-medium">{data.payload.fullDay}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} appointment{data.value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  // Get the busiest day for highlighting
  const maxAppointments = Math.max(...chartData.map(item => item.appointments));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className={`h-5 w-5 mr-2 ${activeClinic === 'dental' ? 'text-dental-primary' : 'text-meditouch-primary'}`} />
          Weekly Appointment Pattern
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
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="appointments"
              fill={activeClinic === 'dental' ? '#4A90E2' : '#6CBFBF'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Weekly breakdown */}
        <div className="mt-6 grid grid-cols-7 gap-2">
          {chartData.map((item) => (
            <div
              key={item.fullDay}
              className={`text-center p-2 rounded-lg border ${
                item.appointments === maxAppointments && maxAppointments > 0
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <div className="text-xs font-medium text-muted-foreground">
                {item.day}
              </div>
              <div className="text-lg font-semibold mt-1">
                {item.appointments}
              </div>
            </div>
          ))}
        </div>

        {/* Additional insights */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Total Appointments</div>
            <div className="text-lg font-semibold">{totalAppointments}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Daily Average</div>
            <div className="text-lg font-semibold">
              {Math.round(totalAppointments / 7)}
            </div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Peak Day</div>
            <div className="text-lg font-semibold">
              {maxAppointments > 0 ? maxAppointments : 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyChart;