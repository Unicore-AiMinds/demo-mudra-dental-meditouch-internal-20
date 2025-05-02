// Define the structure for a dental charting entry
export interface ChartingEntry {
  entryId: string;           // Unique ID for the entry (e.g., 'CE001')
  patientId: string;         // Links to the Patient ID (e.g., 'PT001')
  dateRecorded: string;      // YYYY-MM-DD HH:MM:SS format
  toothNumbers: string[];    // Array of selected tooth numbers ['14', '15']
  surfaces?: string[];       // Optional array e.g., ['M', 'O']
  finding?: string;          // Pre-existing condition e.g., 'Caries', 'Missing Tooth'
  service?: string;          // Treatment e.g., 'Composite Filling', 'Root Canal'
  status: 'Existing' | 'Planned' | 'Completed';
  notes?: string;            // Optional notes - can include treatment plan information
  // References to follow-ups generated from this charting entry
  followUpIds?: string[];
  // If this is a planned treatment that was completed, reference to the completion entry
  completedByEntryId?: string;
  // If this is a completion entry, reference to the original planned entry
  completesEntryId?: string;
}

// Define the tooth numbering system using FDI/ISO 3950 notation
// Format: Quadrant (1-4) + Tooth position (1-8) for permanent teeth
// Format: Quadrant (5-8) + Tooth position (1-5) for primary teeth
// Permanent teeth:
// Quadrant 1: Upper Right, Quadrant 2: Upper Left
// Quadrant 3: Lower Left, Quadrant 4: Lower Right
// Primary teeth:
// Quadrant 5: Upper Right, Quadrant 6: Upper Left
// Quadrant 7: Lower Left, Quadrant 8: Lower Right

// Permanent Teeth (Adult)
// Upper Right (Quadrant 1)
const upperRightTeeth = ['18', '17', '16', '15', '14', '13', '12', '11'];
// Upper Left (Quadrant 2)
const upperLeftTeeth = ['21', '22', '23', '24', '25', '26', '27', '28'];
// Lower Left (Quadrant 3)
const lowerLeftTeeth = ['31', '32', '33', '34', '35', '36', '37', '38'];
// Lower Right (Quadrant 4)
const lowerRightTeeth = ['48', '47', '46', '45', '44', '43', '42', '41'];

// Primary Teeth (Child)
// Upper Right (Quadrant 5)
const upperRightPrimaryTeeth = ['55', '54', '53', '52', '51'];
// Upper Left (Quadrant 6)
const upperLeftPrimaryTeeth = ['61', '62', '63', '64', '65'];
// Lower Left (Quadrant 7)
const lowerLeftPrimaryTeeth = ['71', '72', '73', '74', '75'];
// Lower Right (Quadrant 8)
const lowerRightPrimaryTeeth = ['85', '84', '83', '82', '81'];

// Combined list of all permanent teeth in FDI notation
export const permanentTeethList: string[] = [
  ...upperRightTeeth,
  ...upperLeftTeeth,
  ...lowerLeftTeeth,
  ...lowerRightTeeth
];

// Combined list of all primary teeth in FDI notation
export const primaryTeethList: string[] = [
  ...upperRightPrimaryTeeth,
  ...upperLeftPrimaryTeeth,
  ...lowerLeftPrimaryTeeth,
  ...lowerRightPrimaryTeeth
];

// Default to permanent teeth
export const toothNumbersList: string[] = permanentTeethList;

// Define the tooth surfaces
export const surfacesList: string[] = ['M', 'O', 'D', 'B/F', 'L'];

// Findings are now entered as free text rather than selected from a list

// Define the dental services list (treatments)
export const servicesList: string[] = [
  'Composite Filling',
  'Amalgam Filling',
  'PFM Crown',
  'Zirconia Crown',
  'Root Canal',
  'Extraction',
  'Sealant',
  'Veneer',
  'Bridge',
  'Pontic',
  'Implant',
  'Denture',
  'Scaling',
  'Root Planing',
  'Fluoride Treatment',
  'Orthodontic Treatment'
];

// Define the status options
export const statusOptions: ('Existing' | 'Planned' | 'Completed')[] = [
  'Existing',
  'Planned',
  'Completed'
];
