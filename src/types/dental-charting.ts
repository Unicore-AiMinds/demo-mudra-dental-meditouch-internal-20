// Define the structure for a dental charting entry
export interface ChartingEntry {
  entryId: string;           // Unique ID for the entry (e.g., 'CE001')
  patientId: string;         // Links to the Patient ID (e.g., 'PT001')
  dateRecorded: string;      // YYYY-MM-DD HH:MM:SS format
  toothNumbers: string[];    // Array of selected tooth numbers ['14', '15']
  surfaces?: string[];       // Optional array e.g., ['M', 'O']
  findingTreatment: string;  // e.g., 'Caries', 'Composite Filling'
  status: 'Existing' | 'Planned' | 'Completed';
  notes?: string;            // Optional notes
}

// Define the tooth numbering system using FDI/ISO 3950 notation
// Format: Quadrant (1-4) + Tooth position (1-8)
// Quadrant 1: Upper Right, Quadrant 2: Upper Left
// Quadrant 3: Lower Left, Quadrant 4: Lower Right

// Upper Right (Quadrant 1)
const upperRightTeeth = ['18', '17', '16', '15', '14', '13', '12', '11'];
// Upper Left (Quadrant 2)
const upperLeftTeeth = ['21', '22', '23', '24', '25', '26', '27', '28'];
// Lower Left (Quadrant 3)
const lowerLeftTeeth = ['31', '32', '33', '34', '35', '36', '37', '38'];
// Lower Right (Quadrant 4)
const lowerRightTeeth = ['48', '47', '46', '45', '44', '43', '42', '41'];

// Combined list of all teeth in FDI notation
export const toothNumbersList: string[] = [
  ...upperRightTeeth,
  ...upperLeftTeeth,
  ...lowerLeftTeeth,
  ...lowerRightTeeth
];

// Define the tooth surfaces
export const surfacesList: string[] = ['M', 'O', 'D', 'B/F', 'L'];

// Define the findings and treatments list
export const findingsTreatmentsList: string[] = [
  'Caries',
  'Composite Filling',
  'Amalgam Filling',
  'PFM Crown',
  'Zirconia Crown',
  'RCT Completed',
  'RCT Planned',
  'Missing Tooth',
  'Impacted Tooth',
  'Extraction Planned',
  'Extraction Completed',
  'Sealant',
  'Veneer',
  'Bridge Abutment',
  'Pontic',
  'Implant',
  'Denture'
];

// Define the status options
export const statusOptions: ('Existing' | 'Planned' | 'Completed')[] = [
  'Existing',
  'Planned',
  'Completed'
];
