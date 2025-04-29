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

// Define the tooth numbering system (Universal 1-32)
export const toothNumbersList: string[] = [
  '1', '2', '3', '4', '5', '6', '7', '8',
  '9', '10', '11', '12', '13', '14', '15', '16',
  '17', '18', '19', '20', '21', '22', '23', '24',
  '25', '26', '27', '28', '29', '30', '31', '32'
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
