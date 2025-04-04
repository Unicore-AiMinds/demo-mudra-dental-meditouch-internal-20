import { useState } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  BarChart2,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Sample data for reports
const appointmentData = [
  { month: 'Jan', dental: 65, meditouch: 48 },
  { month: 'Feb', dental: 72, meditouch: 56 },
  { month: 'Mar', dental: 80, meditouch: 62 },
  { month: 'Apr', dental: 75, meditouch: 58 },
  { month: 'May', dental: 85, meditouch: 65 },
  { month: 'Jun', dental: 90, meditouch: 70 },
  { month: 'Jul', dental: 100, meditouch: 75 },
  { month: 'Aug', dental: 95, meditouch: 68 },
  { month: 'Sep', dental: 105, meditouch: 80 },
  { month: 'Oct', dental: 110, meditouch: 85 },
  { month: 'Nov', dental: 120, meditouch: 90 },
  { month: 'Dec', dental: 130, meditouch: 95 },
];

const revenueData = [
  { month: 'Jan', dental: 120000, meditouch: 90000 },
  { month: 'Feb', dental: 135000, meditouch: 98000 },
  { month: 'Mar', dental: 145000, meditouch: 105000 },
  { month: 'Apr', dental: 140000, meditouch: 100000 },
  { month: 'May', dental: 155000, meditouch: 110000 },
  { month: 'Jun', dental: 160000, meditouch: 115000 },
  { month: 'Jul', dental: 175000, meditouch: 120000 },
  { month: 'Aug', dental: 170000, meditouch: 118000 },
  { month: 'Sep', dental: 180000, meditouch: 125000 },
  { month: 'Oct', dental: 185000, meditouch: 130000 },
  { month: 'Nov', dental: 195000, meditouch: 135000 },
  { month: 'Dec', dental: 210000, meditouch: 145000 },
];

const serviceDistributionDental = [
  { name: 'Regular Checkup', value: 35 },
  { name: 'Cleaning', value: 25 },
  { name: 'Fillings', value: 15 },
  { name: 'Root Canal', value: 10 },
  { name: 'Crowns', value: 8 },
  { name: 'Dentures', value: 7 },
];

const serviceDistributionMeditouch = [
  { name: 'Hair Treatment', value: 40 },
  { name: 'Skin Consultation', value: 30 },
  { name: 'Facial', value: 15 },
  { name: 'Dermatology', value: 10 },
  { name: 'Other', value: 5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Key metrics for cards
const keyMetrics = {
  dental: {
    totalPatients: 1842,
    newPatients: 68,
    newPatientsChange: 12,
    appointments: 342,
    appointmentsChange: 8,
    revenue: "₹4.2L",
    revenueChange: 15,
    avgBooking: "₹1,250",
    avgBookingChange: 5
  },
  meditouch: {
    totalPatients: 1356,
    newPatients: 52,
    newPatientsChange: 9,
    appointments: 245,
    appointmentsChange: -3,
    revenue: "₹3.5L",
    revenueChange: 10,
    avgBooking: "₹1,450",
    avgBookingChange: 12
  }
};

const Reports = () => {
  const { activeClinic } = useClinic();
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState("year");
  
  // Filter metrics based on active clinic
  const metrics = activeClinic === 'dental' ? keyMetrics.dental : keyMetrics.meditouch;
  const serviceData = activeClinic === 'dental' ? serviceDistributionDental : serviceDistributionMeditouch;
  
  // Restrict access to admin only
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-4xl font-bold text-gray-300 mb-4">
          <FileText className="h-16 w-16 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          The Reports module is only accessible to administrators.
          Please contact your system administrator if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analyze clinic performance and metrics</p>
        </div>
        
        <div className="flex space-x-2">
          <Select 
            value={timePeriod} 
            onValueChange={setTimePeriod}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className={`h-4 w-4 ${activeClinic === 'dental' ? 'text-dental-primary' : 'text-meditouch-primary'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.newPatients} new this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className={`h-4 w-4 ${activeClinic === 'dental' ? 'text-dental-primary' : 'text-meditouch-primary'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.appointments}</div>
            <div className="flex items-center pt-1">
              {metrics.appointmentsChange >= 0 ? (
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              )}
              <p className={`text-xs ${metrics.appointmentsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.appointmentsChange >= 0 ? '+' : ''}{metrics.appointmentsChange}% from last month
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className={`h-4 w-4 ${activeClinic === 'dental' ? 'text-dental-primary' : 'text-meditouch-primary'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.revenue}</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              <p className="text-xs text-green-500">
                +{metrics.revenueChange}% from last month
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
            <TrendingUp className={`h-4 w-4 ${activeClinic === 'dental' ? 'text-dental-primary' : 'text-meditouch-primary'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgBooking}</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              <p className="text-xs text-green-500">
                +{metrics.avgBookingChange}% from last month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different reports */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2" />
                  Appointment Trends
                </CardTitle>
                <CardDescription>Monthly appointments for both clinics</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={appointmentData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="dental" name="Dental Metrix" fill="#4A90E2" />
                    <Bar dataKey="meditouch" name="Meditouch" fill="#6CBFBF" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Revenue Performance
                </CardTitle>
                <CardDescription>Monthly revenue comparison (₹)</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="dental" 
                      name="Dental Metrix" 
                      stroke="#4A90E2" 
                      fill="rgba(74, 144, 226, 0.2)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="meditouch" 
                      name="Meditouch" 
                      stroke="#6CBFBF" 
                      fill="rgba(108, 191, 191, 0.2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2" />
                Service Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of services for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} Clinic
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Other tabs simplified for brevity */}
        <TabsContent value="appointments" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Appointment Analysis</CardTitle>
              <CardDescription>
                Comprehensive breakdown of appointment metrics for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={appointmentData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey={activeClinic === 'dental' ? "dental" : "meditouch"} 
                    name={activeClinic === 'dental' ? "Dental Metrix" : "Meditouch"} 
                    fill={activeClinic === 'dental' ? "#4A90E2" : "#6CBFBF"}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Displaying appointment data for the selected time period. 
                You can export this data for further analysis.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>
                Financial performance metrics for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} 
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey={activeClinic === 'dental' ? "dental" : "meditouch"}
                    name={activeClinic === 'dental' ? "Dental Metrix" : "Meditouch"} 
                    stroke={activeClinic === 'dental' ? "#4A90E2" : "#6CBFBF"} 
                    fill={activeClinic === 'dental' ? "rgba(74, 144, 226, 0.2)" : "rgba(108, 191, 191, 0.2)"}  
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Showing revenue trends over the selected period. Click Export to download the detailed report.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="services" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Services Distribution</CardTitle>
              <CardDescription>
                Breakdown of services provided at {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Distribution of services by percentage. This helps identify the most popular services.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
