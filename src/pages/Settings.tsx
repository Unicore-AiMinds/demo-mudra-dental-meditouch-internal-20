import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings as SettingsIcon, 
  User, 
  UserPlus, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Edit, 
  Trash2, 
  Save, 
  Plus,
  AlertCircle,
  FileText,
  Microscope,
  RefreshCw
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const clinicDetails = {
  dental: {
    name: "Dental Metrix Clinic",
    address: "123 Healthcare Avenue, Mumbai, Maharashtra 400001",
    phone: "+91 22 4567 8901",
    email: "contact@dentalmetrix.com",
    operatingHours: {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "10:00 AM - 4:00 PM",
      sunday: "Closed"
    }
  },
  meditouch: {
    name: "Meditouch Clinic",
    address: "456 Wellness Road, Mumbai, Maharashtra 400001",
    phone: "+91 22 9876 5432",
    email: "care@meditouchclinic.com",
    operatingHours: {
      monday: "10:00 AM - 7:00 PM",
      tuesday: "10:00 AM - 7:00 PM",
      wednesday: "10:00 AM - 7:00 PM",
      thursday: "10:00 AM - 7:00 PM",
      friday: "10:00 AM - 7:00 PM",
      saturday: "10:00 AM - 5:00 PM",
      sunday: "Closed"
    }
  }
};

const dentalDoctors = [
  { id: 1, name: "Dr. Rajan Khanna", specialization: "General Dentistry", email: "rajan.khanna@dentalmetrix.com" },
  { id: 2, name: "Dr. Priya Desai", specialization: "Orthodontics", email: "priya.desai@dentalmetrix.com" },
  { id: 3, name: "Dr. Vikram Mehta", specialization: "Endodontics", email: "vikram.mehta@dentalmetrix.com" },
  { id: 4, name: "Dr. Ananya Sharma", specialization: "Pediatric Dentistry", email: "ananya.sharma@dentalmetrix.com" }
];

const services = {
  dental: [
    { id: 1, name: "General Checkup", duration: 30, price: 500 },
    { id: 2, name: "Teeth Cleaning", duration: 45, price: 1000 },
    { id: 3, name: "Root Canal Treatment", duration: 60, price: 5000 },
    { id: 4, name: "Dental Filling", duration: 30, price: 1500 },
    { id: 5, name: "Crown Placement", duration: 60, price: 8000 },
    { id: 6, name: "Teeth Whitening", duration: 45, price: 4000 }
  ],
  meditouch: [
    { id: 1, name: "Skin Consultation", duration: 30, price: 800 },
    { id: 2, name: "Hair Loss Treatment", duration: 45, price: 1500 },
    { id: 3, name: "Facial", duration: 60, price: 2000 },
    { id: 4, name: "Dermatology Consultation", duration: 30, price: 1000 },
    { id: 5, name: "Hair Transplant Consultation", duration: 45, price: 1200 },
    { id: 6, name: "Acne Treatment", duration: 30, price: 1800 }
  ]
};

const dentalLabs = [
  { id: 1, name: "Precision Dental Lab", contact: "+91 98765 43210", address: "Mumbai", specialization: "Crowns & Bridges" },
  { id: 2, name: "Nova Dental Solutions", contact: "+91 87654 32109", address: "Delhi", specialization: "Dentures" },
  { id: 3, name: "Dent Creations India", contact: "+91 76543 21098", address: "Bangalore", specialization: "Implants" },
  { id: 4, name: "Implant Specialists", contact: "+91 65432 10987", address: "Chennai", specialization: "Custom Abutments" }
];

const labWorkTypes = [
  { id: 1, name: "PFM Crown", turnaround: "7-10 days" },
  { id: 2, name: "Ceramic Bridge", turnaround: "8-12 days" },
  { id: 3, name: "Acrylic Denture", turnaround: "10-14 days" },
  { id: 4, name: "Cast Partial Framework", turnaround: "12-15 days" },
  { id: 5, name: "Custom Abutment", turnaround: "5-7 days" },
  { id: 6, name: "Hard Acrylic Splint", turnaround: "3-5 days" }
];

const systemUsers = [
  { id: 1, name: "Dr. Rajan Khanna", email: "rajan.khanna@mudraclinic.com", role: "admin", status: "active" },
  { id: 2, name: "Lakshmi Menon", email: "lakshmi.menon@mudraclinic.com", role: "receptionist", status: "active" },
  { id: 3, name: "Dr. Priya Desai", email: "priya.desai@mudraclinic.com", role: "doctor", status: "active" },
  { id: 4, name: "Rajesh Sharma", email: "rajesh.sharma@mudraclinic.com", role: "inventory", status: "active" },
  { id: 5, name: "Arjun Kumar", email: "arjun.kumar@mudraclinic.com", role: "doctor", status: "inactive" }
];

const Settings = () => {
  const { user } = useAuth();
  const { activeClinic } = useClinic();
  const [isAddDoctorDialogOpen, setIsAddDoctorDialogOpen] = useState(false);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isAddLabDialogOpen, setIsAddLabDialogOpen] = useState(false);
  const [isAddLabWorkTypeDialogOpen, setIsAddLabWorkTypeDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-4xl font-bold text-gray-300 mb-4">
          <SettingsIcon className="h-16 w-16 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          The Settings module is only accessible to administrators.
          Please contact your system administrator if you need access.
        </p>
      </div>
    );
  }

  const currentClinicDetails = activeClinic === 'dental' 
    ? clinicDetails.dental 
    : clinicDetails.meditouch;
  
  const currentServices = activeClinic === 'dental' 
    ? services.dental 
    : services.meditouch;
    
  const handleSaveClinicDetails = () => {
    toast({
      title: "Settings Updated",
      description: `${activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} clinic details have been updated.`,
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure and manage system settings</p>
        </div>
      </div>
      
      <Tabs defaultValue="clinic" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="clinic">Clinic Details</TabsTrigger>
          {activeClinic === 'dental' && <TabsTrigger value="doctors">Doctors</TabsTrigger>}
          <TabsTrigger value="services">Services</TabsTrigger>
          {activeClinic === 'dental' && <TabsTrigger value="labs">Labs</TabsTrigger>}
          {activeClinic === 'dental' && <TabsTrigger value="labwork">Lab Work Types</TabsTrigger>}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clinic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} Clinic Information
              </CardTitle>
              <CardDescription>
                Basic information and operating hours for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} clinic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic Name</Label>
                    <Input 
                      id="clinicName" 
                      defaultValue={currentClinicDetails.name} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Address</Label>
                    <Input 
                      id="clinicAddress" 
                      defaultValue={currentClinicDetails.address} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicPhone">Phone Number</Label>
                    <Input 
                      id="clinicPhone"
                      defaultValue={currentClinicDetails.phone} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicEmail">Email</Label>
                    <Input 
                      id="clinicEmail" 
                      type="email" 
                      defaultValue={currentClinicDetails.email} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mondayHours">Monday</Label>
                    <Input 
                      id="mondayHours" 
                      defaultValue={currentClinicDetails.operatingHours.monday} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tuesdayHours">Tuesday</Label>
                    <Input 
                      id="tuesdayHours" 
                      defaultValue={currentClinicDetails.operatingHours.tuesday} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wednesdayHours">Wednesday</Label>
                    <Input 
                      id="wednesdayHours" 
                      defaultValue={currentClinicDetails.operatingHours.wednesday} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thursdayHours">Thursday</Label>
                    <Input 
                      id="thursdayHours" 
                      defaultValue={currentClinicDetails.operatingHours.thursday} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fridayHours">Friday</Label>
                    <Input 
                      id="fridayHours" 
                      defaultValue={currentClinicDetails.operatingHours.friday} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saturdayHours">Saturday</Label>
                    <Input 
                      id="saturdayHours" 
                      defaultValue={currentClinicDetails.operatingHours.saturday} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sundayHours">Sunday</Label>
                    <Input 
                      id="sundayHours" 
                      defaultValue={currentClinicDetails.operatingHours.sunday} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className={`${activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}`}
                onClick={handleSaveClinicDetails}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {activeClinic === 'dental' && (
          <TabsContent value="doctors" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Manage Doctors
                  </CardTitle>
                  <CardDescription>
                    Add and manage doctors for Dental Metrix Clinic
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddDoctorDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Doctor
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dentalDoctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">{doctor.name}</TableCell>
                        <TableCell>{doctor.specialization}</TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Dialog open={isAddDoctorDialogOpen} onOpenChange={setIsAddDoctorDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Doctor</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new doctor. All fields are required.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="doctorName">Full Name</Label>
                      <Input id="doctorName" placeholder="Dr. Full Name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctorSpecialization">Specialization</Label>
                      <Input id="doctorSpecialization" placeholder="e.g., Orthodontics" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctorEmail">Email</Label>
                      <Input id="doctorEmail" type="email" placeholder="doctor@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctorPhone">Phone</Label>
                      <Input id="doctorPhone" placeholder="Contact Number" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDoctorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-dental-primary hover:bg-dental-dark"
                    onClick={() => {
                      toast({
                        title: "Doctor Added",
                        description: "The new doctor has been successfully added.",
                      });
                      setIsAddDoctorDialogOpen(false);
                    }}
                  >
                    Add Doctor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
        
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Manage Services
                </CardTitle>
                <CardDescription>
                  Add and manage services for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} Clinic
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddServiceDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Duration (mins)</TableHead>
                    <TableHead>Price (₹)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.duration}</TableCell>
                      <TableCell>₹{service.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>
                  Enter the details for the new service offering.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceName">Service Name</Label>
                    <Input id="serviceName" placeholder="Enter service name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceDuration">Duration (minutes)</Label>
                    <Input id="serviceDuration" type="number" placeholder="e.g., 30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="servicePrice">Price (₹)</Label>
                    <Input id="servicePrice" type="number" placeholder="e.g., 1500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceDescription">Description (Optional)</Label>
                    <Textarea id="serviceDescription" placeholder="Brief description of the service" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddServiceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className={activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
                  onClick={() => {
                    toast({
                      title: "Service Added",
                      description: "The new service has been successfully added.",
                    });
                    setIsAddServiceDialogOpen(false);
                  }}
                >
                  Add Service
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {activeClinic === 'dental' && (
          <TabsContent value="labs" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Microscope className="mr-2 h-5 w-5" />
                    Manage Labs
                  </CardTitle>
                  <CardDescription>
                    Add and manage dental laboratories for Dental Metrix Clinic
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddLabDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Lab
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lab Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dentalLabs.map((lab) => (
                      <TableRow key={lab.id}>
                        <TableCell className="font-medium">{lab.name}</TableCell>
                        <TableCell>{lab.contact}</TableCell>
                        <TableCell>{lab.address}</TableCell>
                        <TableCell>{lab.specialization}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Dialog open={isAddLabDialogOpen} onOpenChange={setIsAddLabDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Laboratory</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new dental laboratory.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="labName">Laboratory Name</Label>
                      <Input id="labName" placeholder="Enter lab name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labContact">Contact Number</Label>
                      <Input id="labContact" placeholder="e.g., +91 98765 43210" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labAddress">Address/Location</Label>
                      <Input id="labAddress" placeholder="City or full address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labSpecialization">Specialization</Label>
                      <Input id="labSpecialization" placeholder="e.g., Crowns & Bridges" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddLabDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-dental-primary hover:bg-dental-dark"
                    onClick={() => {
                      toast({
                        title: "Laboratory Added",
                        description: "The new dental laboratory has been successfully added.",
                      });
                      setIsAddLabDialogOpen(false);
                    }}
                  >
                    Add Laboratory
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
        
        {activeClinic === 'dental' && (
          <TabsContent value="labwork" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Manage Lab Work Types
                  </CardTitle>
                  <CardDescription>
                    Configure the various types of laboratory work for Dental Metrix Clinic
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddLabWorkTypeDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Work Type
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Type</TableHead>
                      <TableHead>Avg. Turnaround Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labWorkTypes.map((workType) => (
                      <TableRow key={workType.id}>
                        <TableCell className="font-medium">{workType.name}</TableCell>
                        <TableCell>{workType.turnaround}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Dialog open={isAddLabWorkTypeDialogOpen} onOpenChange={setIsAddLabWorkTypeDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Lab Work Type</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new laboratory work type.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workTypeName">Work Type Name</Label>
                      <Input id="workTypeName" placeholder="e.g., Zirconia Crown" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="turnaroundTime">Average Turnaround Time</Label>
                      <Input id="turnaroundTime" placeholder="e.g., 7-10 days" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workTypeNotes">Additional Notes (Optional)</Label>
                      <Textarea id="workTypeNotes" placeholder="Any special handling instructions or notes" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddLabWorkTypeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-dental-primary hover:bg-dental-dark"
                    onClick={() => {
                      toast({
                        title: "Lab Work Type Added",
                        description: "The new lab work type has been successfully added.",
                      });
                      setIsAddLabWorkTypeDialogOpen(false);
                    }}
                  >
                    Add Work Type
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure automated notifications for patients and staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Appointment Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Appointment Confirmation</h4>
                      <p className="text-sm text-muted-foreground">Send confirmation after booking an appointment</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="confirmation-email" />
                      <Label htmlFor="confirmation-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="confirmation-whatsapp" />
                      <Label htmlFor="confirmation-whatsapp">WhatsApp</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Appointment Reminder</h4>
                      <p className="text-sm text-muted-foreground">Send reminder before scheduled appointment</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="reminder-email" defaultChecked />
                      <Label htmlFor="reminder-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="reminder-whatsapp" defaultChecked />
                      <Label htmlFor="reminder-whatsapp">WhatsApp</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Appointment Changes</h4>
                      <p className="text-sm text-muted-foreground">Notify when appointment is rescheduled or cancelled</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="changes-email" defaultChecked />
                      <Label htmlFor="changes-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="changes-whatsapp" defaultChecked />
                      <Label htmlFor="changes-whatsapp">WhatsApp</Label>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold pt-4">Staff Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Daily Schedule</h4>
                      <p className="text-sm text-muted-foreground">Send daily appointment schedule to staff</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="schedule-email" />
                      <Label htmlFor="schedule-email">Email</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Stock Alerts</h4>
                      <p className="text-sm text-muted-foreground">Notify when inventory items are low</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="stock-email" defaultChecked />
                      <Label htmlFor="stock-email">Email</Label>
                    </div>
                  </div>
                  
                  {activeClinic === 'dental' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Lab Work Updates</h4>
                        <p className="text-sm text-muted-foreground">Notify staff about lab work status changes</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="labwork-email" defaultChecked />
                        <Label htmlFor="labwork-email">Email</Label>
                      </div>
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold pt-4">Template Customization</h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Customize the message templates for various notifications.
                    You can use placeholders like {`{patient_name}`}, {`{appointment_date}`}, etc.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="appointmentConfirmationTemplate">Appointment Confirmation Template</Label>
                    <Textarea 
                      id="appointmentConfirmationTemplate" 
                      rows={3}
                      defaultValue={`Dear {patient_name}, your appointment at {clinic_name} has been confirmed for {appointment_date} at {appointment_time}. Thank you for choosing us!`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className={`${activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}`}
                onClick={() => {
                  toast({
                    title: "Notification Settings Updated",
                    description: "Your notification preferences have been saved.",
                  });
                }}
              >
                <Save className="mr-2 h-4 w-4" /> Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Add, edit, and manage system users and their permissions
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddUserDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.status === 'active' ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with appropriate role and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Full Name</Label>
                    <Input id="userName" placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Email</Label>
                    <Input id="userEmail" type="email" placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userRole">Role</Label>
                    <Select>
                      <SelectTrigger id="userRole">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="inventory">Inventory Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userPassword">Temporary Password</Label>
                    <Input id="userPassword" type="password" placeholder="Enter temporary password" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="requirePasswordChange" defaultChecked />
                    <Label htmlFor="requirePasswordChange">Require password change on first login</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "User Created",
                    description: "The new user account has been created successfully.",
                  });
                  setIsAddUserDialogOpen(false);
                }}>
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
