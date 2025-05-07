// Define the structure for prescription records

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  duration: string;
  timing: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
  foodInstructions?: string; // "After food", "Before food", etc.
  instructions: string; // Renamed to notes in UI but keeping for compatibility
  dispenseQuantity: string; // Amount to dispense (e.g., "30 tablets", "100ml")
  frequency?: string; // Keeping for backward compatibility with existing data
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
  doctorRegNo?: string; // Doctor's registration/license number
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
          instructions: "Take after meals with water",
          dispenseQuantity: "21 tablets"
        },
        {
          id: "MED002",
          name: "Ibuprofen",
          dosage: "400mg",
          frequency: "As needed",
          duration: "3 days",
          instructions: "Take for pain, not more than 3 tablets per day",
          dispenseQuantity: "9 tablets"
        }
      ],
      diagnosis: "Dental abscess",
      notes: "Patient allergic to penicillin. Follow up in one week.",
      prescribedBy: "Dr. Khanna",
      status: "Active",
      doctorRegNo: "MCI-12345"
    },
    {
      id: "PR002",
      patientId: "PT001",
      date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      medications: [
        {
          id: "MED003",
          name: "Chlorhexidine Gluconate",
          dosage: "0.12%",
          frequency: "2 times daily",
          duration: "14 days",
          instructions: "Rinse for 30 seconds and spit out. Do not swallow.",
          dispenseQuantity: "300ml bottle"
        }
      ],
      diagnosis: "Gingivitis",
      notes: "Patient reported bleeding gums during brushing. Advised on proper brushing technique.",
      prescribedBy: "Dr. Sharma",
      status: "Completed",
      doctorRegNo: "DCI-45678"
    },
    {
      id: "PR003",
      patientId: "PT001",
      date: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString(),
      medications: [
        {
          id: "MED004",
          name: "Metronidazole",
          dosage: "400mg",
          frequency: "3 times daily",
          duration: "5 days",
          instructions: "Take with food to minimize stomach upset",
          dispenseQuantity: "15 tablets"
        },
        {
          id: "MED005",
          name: "Paracetamol",
          dosage: "500mg",
          frequency: "Every 6 hours as needed",
          duration: "3 days",
          instructions: "Take for pain or fever",
          dispenseQuantity: "12 tablets"
        }
      ],
      diagnosis: "Pericoronitis",
      notes: "Scheduled for wisdom tooth extraction next month.",
      prescribedBy: "Dr. Khanna",
      status: "Cancelled",
      doctorRegNo: "MCI-12345"
    }
  ],
  "PT002": [
    {
      id: "PR201",
      patientId: "PT002",
      date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
      medications: [
        {
          id: "MED201",
          name: "Doxycycline",
          dosage: "100mg",
          frequency: "Once daily",
          duration: "7 days",
          instructions: "Take with a full glass of water. Avoid dairy products 2 hours before and after.",
          dispenseQuantity: "7 tablets"
        }
      ],
      diagnosis: "Periodontal disease",
      notes: "Patient advised to use soft-bristled toothbrush and schedule follow-up in 2 weeks.",
      prescribedBy: "Dr. Patel",
      status: "Active",
      doctorRegNo: "DCI-78901"
    },
    {
      id: "PR202",
      patientId: "PT002",
      date: new Date(new Date().setDate(new Date().getDate() - 45)).toISOString(),
      medications: [
        {
          id: "MED202",
          name: "Fluconazole",
          dosage: "150mg",
          frequency: "Once weekly",
          duration: "2 weeks",
          instructions: "Take with or without food",
          dispenseQuantity: "2 tablets"
        }
      ],
      diagnosis: "Oral candidiasis",
      notes: "Secondary to recent antibiotic use. Advised to maintain good oral hygiene.",
      prescribedBy: "Dr. Sharma",
      status: "Completed",
      doctorRegNo: "DCI-45678"
    }
  ],
  "PT003": [
    {
      id: "PR301",
      patientId: "PT003",
      date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
      medications: [
        {
          id: "MED301",
          name: "Amoxicillin + Clavulanic Acid",
          dosage: "875mg/125mg",
          frequency: "2 times daily",
          duration: "7 days",
          instructions: "Take with food to reduce stomach upset",
          dispenseQuantity: "14 tablets"
        },
        {
          id: "MED302",
          name: "Diclofenac",
          dosage: "50mg",
          frequency: "3 times daily",
          duration: "5 days",
          instructions: "Take with food. Avoid alcohol.",
          dispenseQuantity: "15 tablets"
        }
      ],
      diagnosis: "Severe dental abscess",
      notes: "Patient scheduled for root canal treatment next week.",
      prescribedBy: "Dr. Khanna",
      status: "Active",
      doctorRegNo: "MCI-12345"
    },
    {
      id: "PR302",
      patientId: "PT003",
      date: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString(),
      medications: [
        {
          id: "MED303",
          name: "Prednisolone",
          dosage: "5mg",
          frequency: "Once daily for 3 days, then every other day for 6 days",
          duration: "9 days",
          instructions: "Take in the morning with food",
          dispenseQuantity: "6 tablets"
        }
      ],
      diagnosis: "Oral lichen planus",
      notes: "Patient reported improvement after 1 week. No adverse effects.",
      prescribedBy: "Dr. Sharma",
      status: "Cancelled",
      doctorRegNo: "DCI-45678"
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
          instructions: "Take after meals. Shake well before use.",
          dispenseQuantity: "100ml bottle"
        }
      ],
      diagnosis: "Dental caries with mild infection",
      notes: "Child-friendly formulation. Parent instructed on proper administration.",
      prescribedBy: "Dr. Patel",
      status: "Completed",
      doctorRegNo: "DCI-78901"
    },
    {
      id: "PR102",
      patientId: "PT009",
      date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
      medications: [
        {
          id: "MED102",
          name: "Ibuprofen Suspension",
          dosage: "100mg/5ml",
          frequency: "3 times daily as needed",
          duration: "3 days",
          instructions: "Give after meals. Do not exceed recommended dose.",
          dispenseQuantity: "60ml bottle"
        }
      ],
      diagnosis: "Post-extraction discomfort",
      notes: "Primary tooth extraction. Parent advised on proper care of extraction site.",
      prescribedBy: "Dr. Patel",
      status: "Active",
      doctorRegNo: "DCI-78901"
    }
  ],
  "PT004": [
    {
      id: "PR401",
      patientId: "PT004",
      date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
      medications: [
        {
          id: "MED401",
          name: "Clindamycin",
          dosage: "300mg",
          frequency: "4 times daily",
          duration: "7 days",
          instructions: "Take with a full glass of water",
          dispenseQuantity: "28 capsules"
        }
      ],
      diagnosis: "Dental abscess (penicillin allergy)",
      notes: "Patient allergic to penicillin. Monitor for GI side effects.",
      prescribedBy: "Dr. Khanna",
      status: "Active",
      doctorRegNo: "MCI-12345"
    }
  ],
  "PT005": [
    {
      id: "PR501",
      patientId: "PT005",
      date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
      medications: [
        {
          id: "MED501",
          name: "Triamcinolone Acetonide Dental Paste",
          dosage: "0.1%",
          frequency: "2-3 times daily",
          duration: "7 days",
          instructions: "Apply a thin layer to affected area after meals and at bedtime",
          dispenseQuantity: "5g tube"
        }
      ],
      diagnosis: "Aphthous ulcers",
      notes: "Patient reports recurrent ulcers. Advised to avoid spicy foods and citrus.",
      prescribedBy: "Dr. Sharma",
      status: "Completed",
      doctorRegNo: "DCI-45678"
    },
    {
      id: "PR502",
      patientId: "PT005",
      date: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString(),
      medications: [
        {
          id: "MED502",
          name: "Sodium Fluoride Gel",
          dosage: "1.1%",
          frequency: "Once daily",
          duration: "4 weeks",
          instructions: "Apply to teeth using custom trays for 4 minutes before bedtime",
          dispenseQuantity: "50ml tube"
        }
      ],
      diagnosis: "Dentinal hypersensitivity",
      notes: "Patient advised to avoid acidic foods and beverages.",
      prescribedBy: "Dr. Patel",
      status: "Cancelled",
      doctorRegNo: "DCI-78901"
    }
  ],
  "PT006": [
    {
      id: "PR601",
      patientId: "PT006",
      date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
      medications: [
        {
          id: "MED601",
          name: "Acyclovir",
          dosage: "400mg",
          frequency: "5 times daily",
          duration: "5 days",
          instructions: "Take with or without food at evenly spaced intervals",
          dispenseQuantity: "25 tablets"
        }
      ],
      diagnosis: "Herpes labialis (cold sore)",
      notes: "Patient advised to avoid sharing personal items and to maintain hydration.",
      prescribedBy: "Dr. Khanna",
      status: "Active",
      doctorRegNo: "MCI-12345"
    }
  ],
  "PT007": [
    {
      id: "PR701",
      patientId: "PT007",
      date: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(),
      medications: [
        {
          id: "MED701",
          name: "Benzocaine Gel",
          dosage: "20%",
          frequency: "Up to 4 times daily as needed",
          duration: "7 days",
          instructions: "Apply a small amount to affected area. Do not use for more than 7 days.",
          dispenseQuantity: "15g tube"
        }
      ],
      diagnosis: "Denture-related irritation",
      notes: "Patient advised to remove dentures at night and clean thoroughly.",
      prescribedBy: "Dr. Patel",
      status: "Completed",
      doctorRegNo: "DCI-78901"
    },
    {
      id: "PR702",
      patientId: "PT007",
      date: new Date(new Date().setDate(new Date().getDate() - 120)).toISOString(),
      medications: [
        {
          id: "MED702",
          name: "Nystatin Oral Suspension",
          dosage: "100,000 units/ml",
          frequency: "4 times daily",
          duration: "14 days",
          instructions: "Swish in mouth for 2 minutes then swallow",
          dispenseQuantity: "60ml bottle"
        }
      ],
      diagnosis: "Oral candidiasis secondary to denture use",
      notes: "Patient advised on proper denture hygiene.",
      prescribedBy: "Dr. Sharma",
      status: "Cancelled",
      doctorRegNo: "DCI-45678"
    }
  ],
  "PT008": [
    {
      id: "PR801",
      patientId: "PT008",
      date: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
      medications: [
        {
          id: "MED801",
          name: "Desensitizing Toothpaste",
          dosage: "N/A",
          frequency: "2 times daily",
          duration: "Ongoing",
          instructions: "Apply pea-sized amount. Leave a small amount on affected teeth overnight.",
          dispenseQuantity: "75g tube"
        },
        {
          id: "MED802",
          name: "Potassium Nitrate Gel",
          dosage: "5%",
          frequency: "Once daily",
          duration: "2 weeks",
          instructions: "Apply to sensitive areas before bedtime",
          dispenseQuantity: "30g tube"
        }
      ],
      diagnosis: "Severe dentinal hypersensitivity",
      notes: "Patient reports sensitivity to hot, cold, and sweet. Advised to avoid acidic foods and beverages.",
      prescribedBy: "Dr. Patel",
      status: "Active",
      doctorRegNo: "DCI-78901"
    }
  ]
};
