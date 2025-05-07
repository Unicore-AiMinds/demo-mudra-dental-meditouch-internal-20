import { ChartingEntry } from "../types/dental-charting";
import { format, subDays } from "date-fns";

// Demo charting history data
export const demoChartingHistory: ChartingEntry[] = [
  // Patient: Riya Sharma (PT009) - Child patient with primary teeth
  {
    entryId: "CE101",
    patientId: "PT009",
    dateRecorded: format(subDays(new Date(), 30), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["54", "55"], // Upper right primary molars (FDI notation)
    surfaces: ["O", "M"],
    finding: "Caries",
    status: "Existing",
    notes: "Early stage caries detected in primary teeth during routine checkup."
  },
  {
    entryId: "CE102",
    patientId: "PT009",
    dateRecorded: format(subDays(new Date(), 29), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["54", "55"], // Upper right primary molars (FDI notation)
    surfaces: ["O", "M"],
    service: "Composite Filling",
    status: "Planned",
    notes: "Scheduled for next appointment. Child-friendly approach needed.",
    doctor: "Dr. Patel"
  },
  {
    entryId: "CE103",
    patientId: "PT009",
    dateRecorded: format(subDays(new Date(), 15), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["54", "55"], // Upper right primary molars (FDI notation)
    surfaces: ["O", "M"],
    service: "Composite Filling",
    status: "Completed",
    notes: "Patient was cooperative. Used fluoride varnish after procedure."
  },
  {
    entryId: "CE104",
    patientId: "PT009",
    dateRecorded: format(subDays(new Date(), 14), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["74", "75"], // Lower left primary molars (FDI notation)
    surfaces: ["O"],
    service: "Sealant",
    status: "Completed",
    notes: "Preventive sealants applied to prevent future decay."
  },
  {
    entryId: "CE105",
    patientId: "PT009",
    dateRecorded: format(subDays(new Date(), 7), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["51", "61"], // Upper primary central incisors (FDI notation)
    finding: "Loose Tooth",
    status: "Existing",
    notes: "Natural exfoliation beginning. Parent informed about proper care during this phase."
  },

  // Patient: Aarav Sharma (PT001)
  {
    entryId: "CE001",
    patientId: "PT001",
    dateRecorded: format(subDays(new Date(), 180), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["25", "26"], // Upper left premolars (FDI notation)
    surfaces: ["O", "M"],
    finding: "Caries",
    status: "Existing",
    notes: "Early stage caries detected during routine checkup."
  },
  {
    entryId: "CE002",
    patientId: "PT001",
    dateRecorded: format(subDays(new Date(), 179), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["25", "26"], // Upper left premolars (FDI notation)
    surfaces: ["O", "M"],
    service: "Composite Filling",
    status: "Planned",
    notes: "Scheduled for next appointment.",
    doctor: "Dr. Sharma"
  },
  {
    entryId: "CE003",
    patientId: "PT001",
    dateRecorded: format(subDays(new Date(), 165), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["25", "26"], // Upper left premolars (FDI notation)
    surfaces: ["O", "M"],
    service: "Composite Filling",
    status: "Completed",
    notes: "Patient tolerated procedure well."
  },
  {
    entryId: "CE004",
    patientId: "PT001",
    dateRecorded: format(subDays(new Date(), 90), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["36"], // Lower left first molar (FDI notation)
    service: "PFM Crown",
    status: "Planned",
    notes: "Discussed options with patient, chose PFM for durability.",
    doctor: "Dr. Khanna"
  },
  {
    entryId: "CE005",
    patientId: "PT001",
    dateRecorded: format(subDays(new Date(), 60), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["36"], // Lower left first molar (FDI notation)
    service: "PFM Crown",
    status: "Completed",
    notes: "Final fitting completed, patient satisfied with appearance."
  },

  // Patient: Vikram Singh (PT003)
  {
    entryId: "CE006",
    patientId: "PT003",
    dateRecorded: format(subDays(new Date(), 120), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["47"], // Lower right second molar (FDI notation)
    finding: "Missing Tooth",
    status: "Existing",
    notes: "Patient reports tooth was extracted 5 years ago."
  },
  {
    entryId: "CE007",
    patientId: "PT003",
    dateRecorded: format(subDays(new Date(), 119), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["47"], // Lower right second molar (FDI notation)
    service: "Implant",
    status: "Planned",
    notes: "Discussed implant option, patient interested but wants to consider cost.",
    doctor: "Dr. Sharma"
  },
  {
    entryId: "CE008",
    patientId: "PT003",
    dateRecorded: format(subDays(new Date(), 45), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["37", "36"], // Lower left molars (FDI notation)
    surfaces: ["O"],
    finding: "Amalgam Filling",
    status: "Existing",
    notes: "Old fillings showing signs of wear."
  },
  {
    entryId: "CE009",
    patientId: "PT003",
    dateRecorded: format(subDays(new Date(), 44), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["37", "36"], // Lower left molars (FDI notation)
    surfaces: ["O"],
    service: "Composite Filling",
    status: "Planned",
    notes: "Recommended replacement of old amalgam fillings with composite.",
    doctor: "Dr. Desai"
  },

  // Patient: Neha Kapoor (PT004)
  {
    entryId: "CE010",
    patientId: "PT004",
    dateRecorded: format(subDays(new Date(), 75), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["11", "21"], // Upper central incisors (FDI notation)
    surfaces: ["F"],
    service: "Veneer",
    status: "Planned",
    notes: "Patient interested in improving smile aesthetics.",
    doctor: "Dr. Desai"
  },
  {
    entryId: "CE011",
    patientId: "PT004",
    dateRecorded: format(subDays(new Date(), 45), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["11", "21"], // Upper central incisors (FDI notation)
    surfaces: ["F"],
    service: "Veneer",
    status: "Completed",
    notes: "Veneers placed, patient very satisfied with results."
  },
  {
    entryId: "CE012",
    patientId: "PT004",
    dateRecorded: format(subDays(new Date(), 30), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27"], // Upper posterior teeth (FDI notation)
    service: "Sealant",
    status: "Completed",
    notes: "Preventive sealants applied to all posterior teeth."
  },

  // Patient: Arjun Nair (PT007)
  {
    entryId: "CE013",
    patientId: "PT007",
    dateRecorded: format(subDays(new Date(), 60), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["48"], // Lower right third molar/wisdom tooth (FDI notation)
    finding: "Impacted Tooth",
    status: "Existing",
    notes: "Wisdom tooth partially erupted, causing discomfort."
  },
  {
    entryId: "CE014",
    patientId: "PT007",
    dateRecorded: format(subDays(new Date(), 59), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["48"], // Lower right third molar/wisdom tooth (FDI notation)
    service: "Extraction",
    status: "Planned",
    notes: "Recommended extraction due to impaction and risk of infection.",
    doctor: "Dr. Sharma"
  },
  {
    entryId: "CE015",
    patientId: "PT007",
    dateRecorded: format(subDays(new Date(), 30), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["48"], // Lower right third molar/wisdom tooth (FDI notation)
    service: "Extraction",
    status: "Completed",
    notes: "Extraction performed without complications."
  }
];
