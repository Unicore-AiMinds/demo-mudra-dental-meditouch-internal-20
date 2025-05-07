// Define the structure for medicine records

export interface Medicine {
  id: number;
  name: string;
  dosage: string;
  description?: string;
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

// Demo data for medicines with multiple dosages for some medicines
export const initialMedicines: Medicine[] = [
  {
    id: 1,
    name: "Amoxicillin",
    dosage: "250mg",
    description: "Antibiotic used to treat bacterial infections"
  },
  {
    id: 2,
    name: "Amoxicillin",
    dosage: "500mg",
    description: "Antibiotic used to treat bacterial infections"
  },
  {
    id: 3,
    name: "Ibuprofen",
    dosage: "200mg",
    description: "Non-steroidal anti-inflammatory drug (NSAID) used for pain relief"
  },
  {
    id: 4,
    name: "Ibuprofen",
    dosage: "400mg",
    description: "Non-steroidal anti-inflammatory drug (NSAID) used for pain relief"
  },
  {
    id: 5,
    name: "Ibuprofen",
    dosage: "600mg",
    description: "Non-steroidal anti-inflammatory drug (NSAID) used for pain relief"
  },
  {
    id: 6,
    name: "Chlorhexidine Gluconate",
    dosage: "0.12%",
    description: "Antiseptic mouthwash used to treat gingivitis"
  },
  {
    id: 7,
    name: "Metronidazole",
    dosage: "400mg",
    description: "Antibiotic used to treat various infections"
  },
  {
    id: 8,
    name: "Paracetamol",
    dosage: "500mg",
    description: "Pain reliever and fever reducer"
  },
  {
    id: 9,
    name: "Paracetamol",
    dosage: "650mg",
    description: "Pain reliever and fever reducer"
  },
  {
    id: 10,
    name: "Amoxicillin + Clavulanic Acid",
    dosage: "500mg/125mg",
    description: "Combination antibiotic used to treat bacterial infections"
  },
  {
    id: 11,
    name: "Amoxicillin + Clavulanic Acid",
    dosage: "875mg/125mg",
    description: "Combination antibiotic used to treat bacterial infections"
  },
  {
    id: 12,
    name: "Diclofenac",
    dosage: "50mg",
    description: "NSAID used to treat pain and inflammation"
  },
  {
    id: 13,
    name: "Diclofenac",
    dosage: "75mg",
    description: "NSAID used to treat pain and inflammation"
  }
];
