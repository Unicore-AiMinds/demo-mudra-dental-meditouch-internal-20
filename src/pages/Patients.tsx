
import { useState } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";

import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  CalendarRange, 
  Eye, 
  Edit, 
  Trash,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  email: string | null;
  phone: string;
  address: string;
  clinic: 'dental' | 'meditouch' | 'both';
  lastVisit: string;
}

const demoPatients: Patient[] = [
  {
    id: "PT001",
    name: "Aarav Sharma",
    gender: "male",
    age: 34,
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    address: "123 Modi Street, Mumbai",
    clinic: "both",
    lastVisit: "2023-10-15"
  },
  {
    id: "PT002",
    name: "Priya Patel",
    gender: "female",
    age: 28,
    email: "priya.patel@example.com",
    phone: "+91 87654 32109",
    address: "456 Gandhi Road, Delhi",
    clinic: "meditouch",
    lastVisit: "2023-10-12"
  },
  {
    id: "PT003",
    name: "Vikram Singh",
    gender: "male",
    age: 45,
    email: null,
    phone: "+91 76543 21098",
    address: "789 Nehru Avenue, Chennai",
    clinic: "dental",
    lastVisit: "2023-10-08"
  },
  {
    id: "PT004",
    name: "Neha Kapoor",
    gender: "female",
    age: 31,
    email: "neha.kapoor@example.com",
    phone: "+91 65432 10987",
    address: "234 Tagore Lane, Bangalore",
    clinic: "dental",
    lastVisit: "2023-09-30"
  },
  {
    id: "PT005",
    name: "Rajiv Malhotra",
    gender: "male",
    age: 52,
    email: "rajiv.malhotra@example.com",
    phone: "+91 54321 09876",
    address: "567 Bose Street, Hyderabad",
    clinic: "both",
    lastVisit: "2023-10-02"
  },
  {
    id: "PT006",
    name: "Ananya Reddy",
    gender: "female",
    age: 25,
    email: "ananya.reddy@example.com",
    phone: "+91 43210 98765",
    address: "890 Raman Road, Pune",
    clinic: "meditouch",
    lastVisit: "2023-10-10"
  },
  {
    id: "PT007",
    name: "Arjun Nair",
    gender: "male",
    age: 38,
    email: null,
    phone: "+91 32109 87654",
    address: "123 Krishnan Street, Kochi",
    clinic: "dental",
    lastVisit: "2023-09-25"
  },
  {
    id: "PT008",
    name: "Divya Menon",
    gender: "female",
    age: 29,
    email: "divya.menon@example.com",
    phone: "+91 21098 76543",
    address: "456 Patel Road, Ahmedabad",
    clinic: "both",
    lastVisit: "2023-10-05"
  }
];

const getClinicBadge = (clinic: Patient['clinic'], activeClinic: 'dental' | 'meditouch') => {
  if (clinic === 'both') {
    return (
      <Badge variant="outline" className="border-purple-400 text-purple-600">
        Both Clinics
      </Badge>
    );
  } 
  
  if (clinic === 'dental') {
    return (
      <Badge variant="outline" className={activeClinic === 'dental' ? 'border-dental-primary text-dental-primary' : ''}>
        Dental Metrix
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className={activeClinic === 'meditouch' ? 'border-meditouch-primary text-meditouch-primary' : ''}>
      Meditouch
    </Badge>
  );
};

const Patients = () => {
  const { activeClinic } = useClinic();
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [currentTab, setCurrentTab] = useState<string>("all");
  
  // Filter patients based on current clinic and tab
  const filteredPatients = demoPatients.filter(patient => {
    if (currentTab === "all") {
      return patient.clinic === activeClinic || patient.clinic === 'both';
    }
    return patient.clinic === currentTab || patient.clinic === 'both';
  });
  
  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </div>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => <div className="capitalize">{row.getValue("gender")}</div>,
    },
    {
      accessorKey: "age",
      header: ({ column }) => (
        <div onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Age <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.getValue("phone")}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email");
        return email ? (
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            {email as string}
          </div>
        ) : (
          <div className="text-muted-foreground italic">Not provided</div>
        );
      },
    },
    {
      accessorKey: "clinic",
      header: "Clinic",
      cell: ({ row }) => getClinicBadge(row.getValue("clinic") as Patient['clinic'], activeClinic),
    },
    {
      accessorKey: "lastVisit",
      header: ({ column }) => (
        <div onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Last Visit <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.getValue("lastVisit")}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => console.log("View", row.original.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Edit", row.original.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Patient
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log("Delete", row.original.id)}
              className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Delete Patient
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  
  const table = useReactTable({
    data: filteredPatients,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">Manage patient records and information</p>
        </div>
        <Button 
          onClick={() => setIsAddPatientDialogOpen(true)}
          className={activeClinic === 'dental' 
            ? "bg-dental-primary hover:bg-dental-dark" 
            : "bg-meditouch-primary hover:bg-meditouch-dark"}
        >
          <Plus className="h-4 w-4 mr-2" /> Add New Patient
        </Button>
      </div>
      
      <div className="flex items-center py-4">
        <Input
          placeholder="Search patients..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <Tabs defaultValue="all" className="w-full" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="all">All Patients</TabsTrigger>
          <TabsTrigger value="dental">Dental Metrix</TabsTrigger>
          <TabsTrigger value="meditouch">Meditouch</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Patient Registry</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="dental" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Dental Metrix Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="meditouch" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Meditouch Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* New Patient Dialog */}
      <Dialog open={isAddPatientDialogOpen} onOpenChange={setIsAddPatientDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Enter the patient details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" placeholder="Enter patient's full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <select id="gender" className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input id="age" type="number" placeholder="Enter age" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" placeholder="e.g., +91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="patient@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic">Registered For *</Label>
                <select id="clinic" className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">Select Clinic</option>
                  <option value="dental">Dental Metrix</option>
                  <option value="meditouch">Meditouch</option>
                  <option value="both">Both Clinics</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input id="address" placeholder="Enter patient's address" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Input id="notes" placeholder="Any important medical history or notes" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPatientDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={() => setIsAddPatientDialogOpen(false)}
              className={activeClinic === 'dental' 
                ? "bg-dental-primary hover:bg-dental-dark" 
                : "bg-meditouch-primary hover:bg-meditouch-dark"}
            >
              Add Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patients;
