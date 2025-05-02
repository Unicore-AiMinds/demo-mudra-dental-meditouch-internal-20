import { DentalHistoryEntry, TentativeFollowUp, ServiceFollowUpRule } from "../types/dental-history";
import { addDays, format, subDays } from "date-fns";

// Demo dental history for patients
export const demoDentalHistory: Record<string, DentalHistoryEntry[]> = {
  // Riya Sharma (PT009) - Child patient
  "PT009": [
    {
      appointmentId: "d901",
      patientId: "PT009",
      date: format(subDays(new Date(), 30), 'yyyy-MM-dd'), // 1 month ago
      service: "Pediatric Dental Checkup",
      doctor: "Dr. Patel",
      diagnosisNotes: "First dental visit. Patient has early caries on primary molars.",
      treatmentPlanSuggested: "Composite fillings for affected teeth and preventive sealants.",
      procedurePerformedNotes: "Completed examination and took intraoral photographs. Patient was cooperative."
    },
    {
      appointmentId: "d902",
      patientId: "PT009",
      date: format(subDays(new Date(), 15), 'yyyy-MM-dd'), // 15 days ago
      service: "Composite Filling",
      doctor: "Dr. Patel",
      diagnosisNotes: "Caries on primary molars 54, 55.",
      treatmentPlanSuggested: "Composite fillings with fluoride treatment.",
      procedurePerformedNotes: "Successfully placed composite fillings on teeth #54, #55. Patient was brave and cooperative."
    },
    {
      appointmentId: "d903",
      patientId: "PT009",
      date: format(subDays(new Date(), 14), 'yyyy-MM-dd'), // 14 days ago
      service: "Preventive Care",
      doctor: "Dr. Patel",
      diagnosisNotes: "Preventive care for primary molars.",
      treatmentPlanSuggested: "Sealants on primary molars to prevent future decay.",
      procedurePerformedNotes: "Applied sealants on teeth #74, #75. Provided oral hygiene instructions to both patient and parent."
    },
    {
      appointmentId: "d904",
      patientId: "PT009",
      date: format(subDays(new Date(), 7), 'yyyy-MM-dd'), // 7 days ago
      service: "Follow-up Visit",
      doctor: "Dr. Patel",
      diagnosisNotes: "Follow-up for recent treatments. Primary incisors showing signs of natural exfoliation.",
      treatmentPlanSuggested: "Monitor loose teeth. No intervention needed at this time.",
      procedurePerformedNotes: "Checked recent fillings and sealants. All in good condition. Discussed proper care during tooth loss phase."
    }
  ],

  // Aarav Sharma (PT001)
  "PT001": [
    {
      appointmentId: "d101",
      patientId: "PT001",
      date: format(subDays(new Date(), 180), 'yyyy-MM-dd'), // 6 months ago
      service: "General Checkup",
      doctor: "Dr. Khanna",
      diagnosisNotes: "Patient has mild gingivitis and early signs of plaque buildup.",
      treatmentPlanSuggested: "Regular cleaning and improved brushing technique.",
      procedurePerformedNotes: "Completed full dental examination and cleaning."
    },
    {
      appointmentId: "d102",
      patientId: "PT001",
      date: format(subDays(new Date(), 90), 'yyyy-MM-dd'), // 3 months ago
      service: "Dental Filling",
      doctor: "Dr. Sharma",
      diagnosisNotes: "Small cavity detected in lower right molar.",
      treatmentPlanSuggested: "Composite filling recommended.",
      procedurePerformedNotes: "Successfully placed composite filling on tooth #46."
    },
    {
      appointmentId: "d103",
      patientId: "PT001",
      date: format(subDays(new Date(), 30), 'yyyy-MM-dd'), // 1 month ago
      service: "Teeth Cleaning",
      doctor: "Dr. Desai",
      diagnosisNotes: "Moderate plaque buildup, especially on lower incisors.",
      treatmentPlanSuggested: "Regular cleaning and flossing recommended.",
      procedurePerformedNotes: "Completed scaling and polishing. Patient tolerated procedure well."
    }
  ],

  // Priya Patel (PT002)
  "PT002": [
    {
      appointmentId: "d201",
      patientId: "PT002",
      date: format(subDays(new Date(), 120), 'yyyy-MM-dd'), // 4 months ago
      service: "Root Canal Treatment",
      doctor: "Dr. Sharma",
      diagnosisNotes: "Severe decay in upper left premolar with pulp involvement.",
      treatmentPlanSuggested: "Root canal treatment followed by crown placement.",
      procedurePerformedNotes: "Completed first stage of root canal treatment on tooth #24."
    },
    {
      appointmentId: "d202",
      patientId: "PT002",
      date: format(subDays(new Date(), 113), 'yyyy-MM-dd'), // 3 months, 3 weeks ago
      service: "Root Canal Treatment",
      doctor: "Dr. Sharma",
      diagnosisNotes: "Follow-up for root canal treatment.",
      treatmentPlanSuggested: "Complete root canal and prepare for crown.",
      procedurePerformedNotes: "Completed final stage of root canal treatment. Temporary filling placed."
    },
    {
      appointmentId: "d203",
      patientId: "PT002",
      date: format(subDays(new Date(), 90), 'yyyy-MM-dd'), // 3 months ago
      service: "Crown Placement",
      doctor: "Dr. Khanna",
      diagnosisNotes: "Post root canal assessment for crown placement.",
      treatmentPlanSuggested: "Porcelain crown recommended for tooth #24.",
      procedurePerformedNotes: "Took impressions for crown. Temporary crown placed."
    },
    {
      appointmentId: "d204",
      patientId: "PT002",
      date: format(subDays(new Date(), 75), 'yyyy-MM-dd'), // 2.5 months ago
      service: "Crown Placement",
      doctor: "Dr. Khanna",
      diagnosisNotes: "Final crown placement appointment.",
      treatmentPlanSuggested: "Regular checkups to monitor crown.",
      procedurePerformedNotes: "Permanent crown placed successfully. Occlusion adjusted."
    }
  ],

  // Vikram Singh (PT003)
  "PT003": [
    {
      appointmentId: "d301",
      patientId: "PT003",
      date: format(subDays(new Date(), 60), 'yyyy-MM-dd'), // 2 months ago
      service: "Teeth Whitening",
      doctor: "Dr. Desai",
      diagnosisNotes: "Patient requested teeth whitening procedure.",
      treatmentPlanSuggested: "In-office whitening followed by home maintenance kit.",
      procedurePerformedNotes: "Completed first session of in-office whitening. Shade improved by 3 levels."
    },
    {
      appointmentId: "d302",
      patientId: "PT003",
      date: format(subDays(new Date(), 45), 'yyyy-MM-dd'), // 1.5 months ago
      service: "Teeth Whitening",
      doctor: "Dr. Desai",
      diagnosisNotes: "Follow-up whitening session.",
      treatmentPlanSuggested: "Continue with home maintenance kit.",
      procedurePerformedNotes: "Completed final in-office whitening session. Provided home maintenance kit with instructions."
    }
  ],

  // Neha Kapoor (PT004)
  "PT004": [
    {
      appointmentId: "d401",
      patientId: "PT004",
      date: format(subDays(new Date(), 150), 'yyyy-MM-dd'), // 5 months ago
      service: "General Checkup",
      doctor: "Dr. Khanna",
      diagnosisNotes: "Healthy teeth and gums. Minor staining on anterior teeth.",
      treatmentPlanSuggested: "Regular cleaning and possible whitening in future.",
      procedurePerformedNotes: "Completed full dental examination and cleaning."
    }
  ]
};

// Initial array for tentative follow-ups with demo data
export const initialTentativeFollowUps: TentativeFollowUp[] = [
  // Child patient follow-up
  {
    followUpId: 'fu0',
    patientId: 'PT009',
    patientName: 'Riya Sharma',
    basedOnAppointmentId: 'd904',
    tentativeDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'), // 3 months from now
    followUpSequence: 1,
    totalStepsInSequence: 1,
    sequenceGroupId: 'seq0',
    suggestedServiceName: 'Pediatric Dental Checkup',
    originalService: 'Follow-up Visit',
    originalDoctor: 'Dr. Patel',
    status: 'Pending',
    notes: 'Regular checkup for primary teeth. Monitor loose incisors and check sealants.'
  },

  // Upcoming follow-ups
  {
    followUpId: 'fu1',
    patientId: 'PT001',
    patientName: 'Aarav Sharma',
    basedOnAppointmentId: 'd103',
    tentativeDate: format(addDays(new Date(), 150), 'yyyy-MM-dd'), // 5 months from now
    followUpSequence: 1,
    totalStepsInSequence: 1,
    sequenceGroupId: 'seq1',
    suggestedServiceName: 'Teeth Cleaning',
    originalService: 'Teeth Cleaning',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },
  {
    followUpId: 'fu2',
    patientId: 'PT002',
    patientName: 'Priya Patel',
    basedOnAppointmentId: 'd204',
    tentativeDate: format(addDays(new Date(), -15), 'yyyy-MM-dd'), // 15 days ago (overdue)
    followUpSequence: 1,
    totalStepsInSequence: 2,
    sequenceGroupId: 'seq2',
    suggestedServiceName: 'Crown Adjustment',
    originalService: 'Crown Placement',
    originalDoctor: 'Dr. Khanna',
    status: 'Pending'
  },
  {
    followUpId: 'fu3',
    patientId: 'PT003',
    patientName: 'Vikram Singh',
    basedOnAppointmentId: 'd302',
    tentativeDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'), // 1 month from now
    followUpSequence: 1,
    totalStepsInSequence: 1,
    sequenceGroupId: 'seq3',
    suggestedServiceName: 'Teeth Whitening',
    originalService: 'Teeth Whitening',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },

  // Additional upcoming follow-ups
  {
    followUpId: 'fu4',
    patientId: 'PT004',
    patientName: 'Neha Kapoor',
    basedOnAppointmentId: 'd401',
    tentativeDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), // 1 week from now
    followUpSequence: 1,
    totalStepsInSequence: 2,
    sequenceGroupId: 'seq4',
    suggestedServiceName: 'Root Canal Follow-up',
    originalService: 'Root Canal Treatment',
    originalDoctor: 'Dr. Khanna',
    status: 'Pending'
  },
  {
    followUpId: 'fu16',
    patientId: 'PT004',
    patientName: 'Neha Kapoor',
    basedOnAppointmentId: 'd401',
    tentativeDate: format(addDays(new Date(), 180), 'yyyy-MM-dd'), // 6 months from now
    followUpSequence: 2,
    totalStepsInSequence: 2,
    sequenceGroupId: 'seq4',
    suggestedServiceName: 'General Checkup',
    originalService: 'Root Canal Treatment',
    originalDoctor: 'Dr. Khanna',
    status: 'Pending'
  },
  {
    followUpId: 'fu5',
    patientId: 'PT005',
    patientName: 'Rajiv Malhotra',
    basedOnAppointmentId: 'd501',
    tentativeDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), // 2 weeks from now
    followUpSequence: 1,
    totalStepsInSequence: 2,
    sequenceGroupId: 'seq5',
    suggestedServiceName: 'Crown Adjustment',
    originalService: 'Crown Placement',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },
  {
    followUpId: 'fu17',
    patientId: 'PT005',
    patientName: 'Rajiv Malhotra',
    basedOnAppointmentId: 'd501',
    tentativeDate: format(addDays(new Date(), 180), 'yyyy-MM-dd'), // 6 months from now
    followUpSequence: 2,
    totalStepsInSequence: 2,
    sequenceGroupId: 'seq5',
    suggestedServiceName: 'Crown Check',
    originalService: 'Crown Placement',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },
  {
    followUpId: 'fu6',
    patientId: 'PT007',
    patientName: 'Arjun Nair',
    basedOnAppointmentId: 'd701',
    tentativeDate: format(addDays(new Date(), 21), 'yyyy-MM-dd'), // 3 weeks from now
    followUpSequence: 1,
    totalStepsInSequence: 1,
    sequenceGroupId: 'seq6',
    suggestedServiceName: 'Extraction Site Check',
    originalService: 'Tooth Extraction',
    originalDoctor: 'Dr. Khanna',
    status: 'Pending'
  },
  {
    followUpId: 'fu7',
    patientId: 'PT008',
    patientName: 'Divya Menon',
    basedOnAppointmentId: 'd801',
    tentativeDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'), // 2 months from now
    followUpSequence: 1,
    totalStepsInSequence: 3,
    sequenceGroupId: 'seq7',
    suggestedServiceName: 'Orthodontic Adjustment',
    originalService: 'Braces Placement',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },
  {
    followUpId: 'fu18',
    patientId: 'PT008',
    patientName: 'Divya Menon',
    basedOnAppointmentId: 'd801',
    tentativeDate: format(addDays(new Date(), 120), 'yyyy-MM-dd'), // 4 months from now
    followUpSequence: 2,
    totalStepsInSequence: 3,
    sequenceGroupId: 'seq7',
    suggestedServiceName: 'Orthodontic Adjustment',
    originalService: 'Braces Placement',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },
  {
    followUpId: 'fu19',
    patientId: 'PT008',
    patientName: 'Divya Menon',
    basedOnAppointmentId: 'd801',
    tentativeDate: format(addDays(new Date(), 180), 'yyyy-MM-dd'), // 6 months from now
    followUpSequence: 3,
    totalStepsInSequence: 3,
    sequenceGroupId: 'seq7',
    suggestedServiceName: 'Orthodontic Adjustment',
    originalService: 'Braces Placement',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },

  // Overdue follow-ups
  {
    followUpId: 'fu8',
    patientId: 'PT001',
    patientName: 'Aarav Sharma',
    basedOnAppointmentId: 'd104',
    tentativeDate: format(addDays(new Date(), -30), 'yyyy-MM-dd'), // 1 month ago
    followUpSequence: 1,
    totalStepsInSequence: 2,
    sequenceGroupId: 'seq8',
    suggestedServiceName: 'Crown Check',
    originalService: 'Crown Placement',
    originalDoctor: 'Dr. Khanna',
    status: 'Pending'
  },
  {
    followUpId: 'fu20',
    patientId: 'PT001',
    patientName: 'Aarav Sharma',
    basedOnAppointmentId: 'd104',
    tentativeDate: format(addDays(new Date(), 150), 'yyyy-MM-dd'), // 5 months from now
    followUpSequence: 2,
    totalStepsInSequence: 2,
    sequenceGroupId: 'seq8',
    suggestedServiceName: 'General Checkup',
    originalService: 'Crown Placement',
    originalDoctor: 'Dr. Khanna',
    status: 'Pending'
  },
  {
    followUpId: 'fu9',
    patientId: 'PT003',
    patientName: 'Vikram Singh',
    basedOnAppointmentId: 'd303',
    tentativeDate: format(addDays(new Date(), -45), 'yyyy-MM-dd'), // 1.5 months ago
    followUpSequence: 1,
    totalStepsInSequence: 1,
    sequenceGroupId: 'seq9',
    suggestedServiceName: 'Whitening Follow-up',
    originalService: 'Teeth Whitening',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },
  {
    followUpId: 'fu10',
    patientId: 'PT004',
    patientName: 'Neha Kapoor',
    basedOnAppointmentId: 'd402',
    tentativeDate: format(addDays(new Date(), -7), 'yyyy-MM-dd'), // 1 week ago
    followUpSequence: 1,
    totalStepsInSequence: 1,
    sequenceGroupId: 'seq10',
    suggestedServiceName: 'Veneer Check',
    originalService: 'Veneer Placement',
    originalDoctor: 'Dr. Khanna',
    status: 'Pending'
  },
  {
    followUpId: 'fu11',
    patientId: 'PT005',
    patientName: 'Rajiv Malhotra',
    basedOnAppointmentId: 'd502',
    tentativeDate: format(addDays(new Date(), -60), 'yyyy-MM-dd'), // 2 months ago
    followUpSequence: 1,
    totalStepsInSequence: 2,
    sequenceGroupId: 'seq11',
    suggestedServiceName: 'General Checkup',
    originalService: 'Root Canal Treatment',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },
  {
    followUpId: 'fu21',
    patientId: 'PT005',
    patientName: 'Rajiv Malhotra',
    basedOnAppointmentId: 'd502',
    tentativeDate: format(addDays(new Date(), 120), 'yyyy-MM-dd'), // 4 months from now
    followUpSequence: 2,
    totalStepsInSequence: 2,
    sequenceGroupId: 'seq11',
    suggestedServiceName: 'General Checkup',
    originalService: 'Root Canal Treatment',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },

  // Multiple follow-ups for the same patient
  {
    followUpId: 'fu12',
    patientId: 'PT007',
    patientName: 'Arjun Nair',
    basedOnAppointmentId: 'd702',
    tentativeDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'), // 3 months from now
    followUpSequence: 1,
    totalStepsInSequence: 1,
    sequenceGroupId: 'seq12',
    suggestedServiceName: 'Implant Consultation',
    originalService: 'Extraction Completed',
    originalDoctor: 'Dr. Khanna',
    status: 'Pending'
  },
  {
    followUpId: 'fu13',
    patientId: 'PT007',
    patientName: 'Arjun Nair',
    basedOnAppointmentId: 'd703',
    tentativeDate: format(addDays(new Date(), 180), 'yyyy-MM-dd'), // 6 months from now
    followUpSequence: 1,
    totalStepsInSequence: 1,
    sequenceGroupId: 'seq13',
    suggestedServiceName: 'General Checkup',
    originalService: 'General Checkup',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },

  // Follow-ups for different services
  {
    followUpId: 'fu14',
    patientId: 'PT008',
    patientName: 'Divya Menon',
    basedOnAppointmentId: 'd802',
    tentativeDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'), // 10 days from now
    followUpSequence: 1,
    totalStepsInSequence: 1,
    sequenceGroupId: 'seq14',
    suggestedServiceName: 'Sensitivity Check',
    originalService: 'Teeth Whitening',
    originalDoctor: 'Dr. Desai',
    status: 'Pending'
  },
  {
    followUpId: 'fu15',
    patientId: 'PT002',
    patientName: 'Priya Patel',
    basedOnAppointmentId: 'd205',
    tentativeDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'), // 5 days from now
    followUpSequence: 1,
    totalStepsInSequence: 1,
    sequenceGroupId: 'seq15',
    suggestedServiceName: 'Gum Treatment Follow-up',
    originalService: 'Periodontal Treatment',
    originalDoctor: 'Dr. Khanna',
    status: 'Pending'
  }
];

// Demo services with follow-up configuration
export const demoServicesWithFollowUp = [
  {
    id: 1,
    name: "Pediatric Dental Checkup",
    duration: 45,
    price: 800,
    description: "Child-friendly comprehensive dental examination and consultation",
    requiresFollowUp: true,
    defaultFollowUpIntervalDays: 90, // 3 months for children
    numberOfFollowUps: 1,
    followUpServiceName: "Pediatric Dental Checkup"
  },
  {
    id: 2,
    name: "General Checkup",
    duration: 30,
    price: 500,
    description: "Comprehensive dental examination and consultation",
    requiresFollowUp: true,
    defaultFollowUpIntervalDays: 180, // 6 months
    numberOfFollowUps: 1,
    followUpServiceName: "General Checkup"
  },
  {
    id: 3,
    name: "Teeth Cleaning",
    duration: 45,
    price: 1000,
    description: "Professional cleaning and polishing",
    requiresFollowUp: true,
    defaultFollowUpIntervalDays: 180, // 6 months
    numberOfFollowUps: 1,
    followUpServiceName: "Teeth Cleaning"
  },
  {
    id: 4,
    name: "Root Canal Treatment",
    duration: 60,
    price: 5000,
    description: "Treatment for infected tooth pulp",
    requiresFollowUp: true,
    defaultFollowUpIntervalDays: 7, // 1 week
    numberOfFollowUps: 1,
    followUpServiceName: "Root Canal Follow-up"
  },
  {
    id: 5,
    name: "Dental Filling",
    duration: 30,
    price: 1500,
    description: "Filling for cavities and tooth decay",
    requiresFollowUp: false,
    defaultFollowUpIntervalDays: 0,
    numberOfFollowUps: 0,
    followUpServiceName: ""
  },
  {
    id: 6,
    name: "Crown Placement",
    duration: 60,
    price: 8000,
    description: "Dental crown placement procedure",
    requiresFollowUp: true,
    defaultFollowUpIntervalDays: 14, // 2 weeks
    numberOfFollowUps: 1,
    followUpServiceName: "Crown Adjustment"
  },
  {
    id: 6,
    name: "Teeth Whitening",
    duration: 45,
    price: 4000,
    description: "Professional teeth whitening procedure",
    requiresFollowUp: true,
    defaultFollowUpIntervalDays: 14, // 2 weeks
    numberOfFollowUps: 1,
    followUpServiceName: "Whitening Follow-up"
  }
];

// Demo service follow-up rules

export const demoFollowUpRules: ServiceFollowUpRule[] = [
  {
    ruleId: "rule1",
    triggeringServiceName: "General Checkup",
    followUps: [
      {
        sequence: 1,
        intervalDays: 180, // 6 months
        suggestedServiceName: "General Checkup",
        notes: "Regular 6-month checkup"
      }
    ]
  },
  {
    ruleId: "rule2",
    triggeringServiceName: "Teeth Cleaning",
    followUps: [
      {
        sequence: 1,
        intervalDays: 180, // 6 months
        suggestedServiceName: "Teeth Cleaning",
        notes: "Regular 6-month cleaning"
      }
    ]
  },
  {
    ruleId: "rule3",
    triggeringServiceName: "Root Canal Treatment",
    followUps: [
      {
        sequence: 1,
        intervalDays: 7, // 1 week
        suggestedServiceName: "Root Canal Follow-up",
        notes: "Check healing and remove temporary filling if needed"
      },
      {
        sequence: 2,
        intervalDays: 180, // 6 months
        suggestedServiceName: "General Checkup",
        notes: "Regular checkup with special attention to treated tooth"
      }
    ]
  },
  {
    ruleId: "rule4",
    triggeringServiceName: "Crown Placement",
    followUps: [
      {
        sequence: 1,
        intervalDays: 14, // 2 weeks
        suggestedServiceName: "Crown Adjustment",
        notes: "Check fit and make adjustments if needed"
      },
      {
        sequence: 2,
        intervalDays: 180, // 6 months
        suggestedServiceName: "Crown Check",
        notes: "Verify crown integrity and gum health"
      }
    ]
  },
  {
    ruleId: "rule5",
    triggeringServiceName: "Teeth Whitening",
    followUps: [
      {
        sequence: 1,
        intervalDays: 14, // 2 weeks
        suggestedServiceName: "Whitening Follow-up",
        notes: "Assess results and touch up if needed"
      }
    ]
  }
];