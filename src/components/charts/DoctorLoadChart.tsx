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
import { UserCheck } from "lucide-react";
import { useClinic } from "@/contexts/ClinicContext";
import { sortByValue, calculatePercentage } from "@/utils/reportsUtils";

interface DoctorLoadChartProps {
  data: Record<string, number>;
  insight: string;
  isLoading?: boolean;
}

const DoctorLoadChart: React.FC<DoctorLoadChartProps> = ({
  data,
  insight,
  isLoading
}) => {
  const { activeClinic, isDental } = useClinic();

  // Convert data to chart format and sort by patient count
  const chartData = sortByValue(data)
    .map(([doctor, count]) => ({
      doctor: doctor.replace('Dr. ', '').substring(0, 15), // Remove 'Dr.' prefix and limit length
      fullDoctor: doctor,
      patients: count,
    }));

  const totalPatients = Object.values(data).reduce((sum, count) => sum + count, 0);

  // Don't show this component for Meditouch clinic
  if (!isDental) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Staff Workload
          </CardTitle>
          <CardDescription>Staff workload analysis not available for Meditouch clinic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">This analysis is specific to dental clinic</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Doctor Workload
          </CardTitle>
          <CardDescription>Loading doctor workload data...</CardDescription>
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
            <UserCheck className="h-5 w-5 mr-2" />
            Doctor Workload
          </CardTitle>
          <CardDescription>Patient distribution across doctors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">No doctor appointment data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = calculatePercentage(data.value, totalPatients);
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.payload.fullDoctor}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} appointment{data.value !== 1 ? 's' : ''} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Get the doctor with most appointments for highlighting
  const maxPatients = Math.max(...chartData.map(item => item.patients));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserCheck className="h-5 w-5 mr-2 text-dental-primary" />
          Doctor Workload
        </CardTitle>
        <CardDescription>
          {insight}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="doctor"
              width={70}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="patients"
              fill="#4A90E2"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Doctor statistics */}
        <div className="mt-6 space-y-3">
          {chartData.map((item) => {
            const percentage = calculatePercentage(item.patients, totalPatients);
            return (
              <div
                key={item.fullDoctor}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.patients === maxPatients && maxPatients > 0
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3 bg-dental-primary"
                  />
                  <span className="font-medium">{item.fullDoctor}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {percentage}%
                  </span>
                  <span className="font-semibold">
                    {item.patients} appointments
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary statistics */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Total Doctors</div>
            <div className="text-lg font-semibold">{chartData.length}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Total Appointments</div>
            <div className="text-lg font-semibold">{totalPatients}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Average per Doctor</div>
            <div className="text-lg font-semibold">
              {chartData.length > 0 ? Math.round(totalPatients / chartData.length) : 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorLoadChart;