// Define the structure for vital signs records

export interface VitalSign {
  id: string;
  patientId: string;
  date: string; // ISO date string
  weight: string; // in kg
  bloodPressure: string; // systolic/diastolic (mmHg)
  pulse: string; // beats per minute (bpm)
  temperature: string; // in Celsius (°C)
  respiratoryRate: string; // breaths per minute (breaths/min)
  notes?: string;
  recordedBy: string;
}

// Normal ranges for vital signs (for reference)
export const vitalSignRanges = {
  // Adult ranges
  adult: {
    bloodPressure: {
      systolic: { min: 90, max: 120 },
      diastolic: { min: 60, max: 80 }
    },
    pulse: { min: 60, max: 100 },
    temperature: { min: 36.1, max: 37.2 },
    respiratoryRate: { min: 12, max: 20 }
  },
  // Child ranges (approximate, varies by age)
  child: {
    bloodPressure: {
      systolic: { min: 70, max: 110 },
      diastolic: { min: 40, max: 70 }
    },
    pulse: { min: 70, max: 120 },
    temperature: { min: 36.5, max: 37.5 },
    respiratoryRate: { min: 20, max: 30 }
  }
};

// Helper function to check if vital signs are within normal range
export const isVitalSignNormal = (
  value: number,
  type: 'systolic' | 'diastolic' | 'pulse' | 'temperature' | 'respiratoryRate',
  isChild: boolean = false
): boolean => {
  const ranges = isChild ? vitalSignRanges.child : vitalSignRanges.adult;

  switch (type) {
    case 'systolic':
      return value >= ranges.bloodPressure.systolic.min && value <= ranges.bloodPressure.systolic.max;
    case 'diastolic':
      return value >= ranges.bloodPressure.diastolic.min && value <= ranges.bloodPressure.diastolic.max;
    case 'pulse':
      return value >= ranges.pulse.min && value <= ranges.pulse.max;
    case 'temperature':
      return value >= ranges.temperature.min && value <= ranges.temperature.max;
    case 'respiratoryRate':
      return value >= ranges.respiratoryRate.min && value <= ranges.respiratoryRate.max;
    default:
      return true;
  }
};

// Demo data for vital signs
export const demoVitalSigns: Record<string, VitalSign[]> = {
  "PT001": [
    {
      id: "VS001",
      patientId: "PT001",
      date: new Date().toISOString(),
      weight: "75",
      bloodPressure: "120/80",
      pulse: "72",
      temperature: "36.8",
      respiratoryRate: "16",
      notes: "Patient appears healthy. No concerns.",
      recordedBy: "Dr. Khanna"
    },
    {
      id: "VS002",
      patientId: "PT001",
      date: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
      weight: "78",
      bloodPressure: "125/85",
      pulse: "75",
      temperature: "37.0",
      respiratoryRate: "18",
      notes: "Slight elevation in BP. Advised to monitor.",
      recordedBy: "Dr. Desai"
    }
  ],
  "PT009": [
    {
      id: "VS101",
      patientId: "PT009",
      date: new Date().toISOString(),
      weight: "22",
      bloodPressure: "90/60",
      pulse: "90",
      temperature: "36.5",
      respiratoryRate: "20",
      notes: "Normal vital signs for age. Child was cooperative.",
      recordedBy: "Dr. Patel"
    }
  ]
};
