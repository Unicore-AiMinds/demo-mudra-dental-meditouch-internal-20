// Define the structure for prescription records

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  date: string; // ISO date string
  medications: Medication[];
  diagnosis: string;
  notes?: string;
  prescribedBy: string;
  status: 'Active' | 'Completed' | 'Cancelled';
}

// Demo data for prescriptions
export const demoPrescriptions: Record<string, Prescription[]> = {
  "PT001": [
    {
      id: "PR001",
      patientId: "PT001",
      date: new Date().toISOString(),
      medications: [
        {
          id: "MED001",
          name: "Amoxicillin",
          dosage: "500mg",
          frequency: "3 times daily",
          duration: "7 days",
          instructions: "Take after meals with water"
        },
        {
          id: "MED002",
          name: "Ibuprofen",
          dosage: "400mg",
          frequency: "As needed",
          duration: "3 days",
          instructions: "Take for pain, not more than 3 tablets per day"
        }
      ],
      diagnosis: "Dental abscess",
      notes: "Patient allergic to penicillin. Follow up in one week.",
      prescribedBy: "Dr. Khanna",
      status: "Active"
    }
  ],
  "PT009": [
    {
      id: "PR101",
      patientId: "PT009",
      date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
      medications: [
        {
          id: "MED101",
          name: "Amoxicillin Suspension",
          dosage: "250mg/5ml",
          frequency: "2 times daily",
          duration: "5 days",
          instructions: "Take after meals. Shake well before use."
        }
      ],
      diagnosis: "Dental caries with mild infection",
      notes: "Child-friendly formulation. Parent instructed on proper administration.",
      prescribedBy: "Dr. Patel",
      status: "Completed"
    }
  ]
};
