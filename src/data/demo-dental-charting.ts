import { ChartingEntry } from "../types/dental-charting";
import { format, subDays } from "date-fns";

// Demo charting history data
export const demoChartingHistory: ChartingEntry[] = [
  // Patient: Aarav Sharma (PT001)
  {
    entryId: "CE001",
    patientId: "PT001",
    dateRecorded: format(subDays(new Date(), 180), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["14", "15"],
    surfaces: ["O", "M"],
    findingTreatment: "Caries",
    status: "Existing",
    notes: "Early stage caries detected during routine checkup."
  },
  {
    entryId: "CE002",
    patientId: "PT001",
    dateRecorded: format(subDays(new Date(), 179), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["14", "15"],
    surfaces: ["O", "M"],
    findingTreatment: "Composite Filling",
    status: "Planned",
    notes: "Scheduled for next appointment."
  },
  {
    entryId: "CE003",
    patientId: "PT001",
    dateRecorded: format(subDays(new Date(), 165), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["14", "15"],
    surfaces: ["O", "M"],
    findingTreatment: "Composite Filling",
    status: "Completed",
    notes: "Patient tolerated procedure well."
  },
  {
    entryId: "CE004",
    patientId: "PT001",
    dateRecorded: format(subDays(new Date(), 90), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["19"],
    findingTreatment: "PFM Crown",
    status: "Planned",
    notes: "Discussed options with patient, chose PFM for durability."
  },
  {
    entryId: "CE005",
    patientId: "PT001",
    dateRecorded: format(subDays(new Date(), 60), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["19"],
    findingTreatment: "PFM Crown",
    status: "Completed",
    notes: "Final fitting completed, patient satisfied with appearance."
  },

  // Patient: Vikram Singh (PT003)
  {
    entryId: "CE006",
    patientId: "PT003",
    dateRecorded: format(subDays(new Date(), 120), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["30"],
    findingTreatment: "Missing Tooth",
    status: "Existing",
    notes: "Patient reports tooth was extracted 5 years ago."
  },
  {
    entryId: "CE007",
    patientId: "PT003",
    dateRecorded: format(subDays(new Date(), 119), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["30"],
    findingTreatment: "Implant",
    status: "Planned",
    notes: "Discussed implant option, patient interested but wants to consider cost."
  },
  {
    entryId: "CE008",
    patientId: "PT003",
    dateRecorded: format(subDays(new Date(), 45), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["18", "19"],
    surfaces: ["O"],
    findingTreatment: "Amalgam Filling",
    status: "Existing",
    notes: "Old fillings showing signs of wear."
  },
  {
    entryId: "CE009",
    patientId: "PT003",
    dateRecorded: format(subDays(new Date(), 44), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["18", "19"],
    surfaces: ["O"],
    findingTreatment: "Composite Filling",
    status: "Planned",
    notes: "Recommended replacement of old amalgam fillings with composite."
  },

  // Patient: Neha Kapoor (PT004)
  {
    entryId: "CE010",
    patientId: "PT004",
    dateRecorded: format(subDays(new Date(), 75), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["8", "9"],
    surfaces: ["F"],
    findingTreatment: "Veneer",
    status: "Planned",
    notes: "Patient interested in improving smile aesthetics."
  },
  {
    entryId: "CE011",
    patientId: "PT004",
    dateRecorded: format(subDays(new Date(), 45), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["8", "9"],
    surfaces: ["F"],
    findingTreatment: "Veneer",
    status: "Completed",
    notes: "Veneers placed, patient very satisfied with results."
  },
  {
    entryId: "CE012",
    patientId: "PT004",
    dateRecorded: format(subDays(new Date(), 30), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"],
    findingTreatment: "Sealant",
    status: "Completed",
    notes: "Preventive sealants applied to all posterior teeth."
  },

  // Patient: Arjun Nair (PT007)
  {
    entryId: "CE013",
    patientId: "PT007",
    dateRecorded: format(subDays(new Date(), 60), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["32"],
    findingTreatment: "Impacted Tooth",
    status: "Existing",
    notes: "Wisdom tooth partially erupted, causing discomfort."
  },
  {
    entryId: "CE014",
    patientId: "PT007",
    dateRecorded: format(subDays(new Date(), 59), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["32"],
    findingTreatment: "Extraction Planned",
    status: "Planned",
    notes: "Recommended extraction due to impaction and risk of infection."
  },
  {
    entryId: "CE015",
    patientId: "PT007",
    dateRecorded: format(subDays(new Date(), 30), 'yyyy-MM-dd HH:mm:ss'),
    toothNumbers: ["32"],
    findingTreatment: "Extraction Completed",
    status: "Completed",
    notes: "Extraction performed without complications."
  }
];
