// Define the structure for medicine records

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Helper function to get unique medicine names from the list
export const getUniqueMedicineNames = (medicines: Medicine[]): string[] => {
  const uniqueNames = new Set<string>();
  medicines.forEach(medicine => uniqueNames.add(medicine.name));
  return Array.from(uniqueNames);
};

// Helper function to get dosages for a specific medicine name
export const getDosagesForMedicine = (medicines: Medicine[], medicineName: string): string[] => {
  return medicines
    .filter(medicine => medicine.name === medicineName)
    .map(medicine => medicine.dosage);
};

// Default medicines for initialization
export const defaultMedicines = [
  {
    name: "Amoxicillin",
    dosage: "250mg",
    description: "Antibiotic used to treat bacterial infections"
  },
  {
    name: "Amoxicillin",
    dosage: "500mg",
    description: "Antibiotic used to treat bacterial infections"
  },
  {
    name: "Ibuprofen",
    dosage: "200mg",
    description: "Non-steroidal anti-inflammatory drug (NSAID) used for pain relief"
  },
  {
    name: "Ibuprofen",
    dosage: "400mg",
    description: "Non-steroidal anti-inflammatory drug (NSAID) used for pain relief"
  },
  {
    name: "Ibuprofen",
    dosage: "600mg",
    description: "Non-steroidal anti-inflammatory drug (NSAID) used for pain relief"
  },
  {
    name: "Chlorhexidine Gluconate",
    dosage: "0.12%",
    description: "Antiseptic mouthwash used to treat gingivitis"
  },
  {
    name: "Metronidazole",
    dosage: "400mg",
    description: "Antibiotic used to treat various infections"
  },
  {
    name: "Paracetamol",
    dosage: "500mg",
    description: "Pain reliever and fever reducer"
  },
  {
    name: "Paracetamol",
    dosage: "650mg",
    description: "Pain reliever and fever reducer"
  },
  {
    name: "Amoxicillin + Clavulanic Acid",
    dosage: "500mg/125mg",
    description: "Combination antibiotic used to treat bacterial infections"
  }
];
