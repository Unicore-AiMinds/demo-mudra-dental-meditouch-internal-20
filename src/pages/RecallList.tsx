import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFollowUps, FollowUp } from '@/contexts/FollowUpContext';
import { useClinic } from '@/contexts/ClinicContext';
import { format, isAfter, isBefore, parseISO, addMonths } from 'date-fns';
import { Calendar, Search, Filter, ArrowUpDown, Clock, AlarmClock, FileText, Info, RefreshCw, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAppointments } from '@/contexts/AppointmentContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useDentalHistory } from '@/contexts/DentalHistoryContext';
import { useServices } from '@/contexts/ServiceContext';

const RecallList = () => {
  const {
    followUps,
    isLoading,
    fetchFollowUps,
    snoozeFollowUp,
    activateFollowUp,
    getPendingFollowUps,
    getSnoozedFollowUps,
    getWaitingFollowUps,
    scheduleFollowUp,
    createMissingFollowUps,
    deleteFollowUp,
    updateFollowUp
  } = useFollowUps();
  const { activeClinic } = useClinic();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { markAppointmentCompleted } = useDentalHistory();
  const { dentalServices, meditouchServices } = useServices();

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'patient'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default to ascending (earliest first)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'overdue'>('all');
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'snoozed' | 'waiting'>('pending');

  // State for snooze dialog
  const [isSnoozeDialogOpen, setIsSnoozeDialogOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [snoozeDate, setSnoozeDate] = useState<Date | undefined>(undefined);
  const [snoozeNotes, setSnoozeNotes] = useState('');

  // State for details dialog
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [detailsFollowUp, setDetailsFollowUp] = useState<FollowUp | null>(null);

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<FollowUp | null>(null);

  // Refresh data when tab changes
  useEffect(() => {
    console.log('Tab changed, fetching follow-ups...');
    fetchFollowUps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // EMERGENCY FIX: Removed fetchFollowUps dependency to prevent infinite loops

  // Refresh data when component mounts (EMERGENCY FIX: Removed aggressive polling)
  useEffect(() => {
    console.log('RecallList component mounted, fetching follow-ups...');

    // Initial data load
    const loadData = async () => {
      console.log('Initial data load...');
      await fetchFollowUps();

      // CRITICAL FIX: DISABLE automatic follow-up creation
      // Follow-ups should ONLY be created when appointments are marked as completed
      console.log('Automatic follow-up creation DISABLED - follow-ups are created only when appointments are completed');
      // await createMissingFollowUps(); // DISABLED
      // await createFollowUpsFromDentalHistory(); // DISABLED

      // Final refresh
      await fetchFollowUps();
    };

    loadData();

    // EMERGENCY FIX: Removed 15-second polling to prevent excessive database requests
    // Users can use the manual "Refresh Follow-ups" button instead
    // const intervalId = setInterval(() => {
    //   console.log('Polling for follow-ups...');
    //   fetchFollowUps();
    // }, 15000);

    // CRITICAL FIX: Listen for custom refresh event (keep this for cross-component communication)
    const handleRefreshEvent = async () => {
      console.log('🔄 Received refresh-follow-ups event, refreshing all data...');
      await fetchFollowUps();
      await fetchWaitingFollowUpsDirectly();
      console.log('✅ Completed refresh after follow-up creation event');
    };

    // Add event listener for custom refresh event
    document.addEventListener('refresh-follow-ups', handleRefreshEvent);

    // Clean up event listener on unmount (no interval to clean up anymore)
    return () => {
      console.log('Cleaning up event listener');
      // clearInterval(intervalId); // No longer needed
      document.removeEventListener('refresh-follow-ups', handleRefreshEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // EMERGENCY FIX: Empty dependency array to prevent loops, only run on mount

  // Helper function to deduplicate follow-ups
  const deduplicateFollowUps = (followUps: FollowUp[]): FollowUp[] => {
    // Create a map to track unique follow-ups by patient and appointment
    const uniqueMap = new Map<string, FollowUp>();

    // Sort by created_at (newest first) so we keep the most recent entries
    const sortedFollowUps = [...followUps].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

      // If created_at dates are the same, use ID as a tiebreaker for stable sorting
      if (dateA === dateB) {
        return (a.id || '').localeCompare(b.id || '');
      }

      return dateB - dateA; // Newest first
    });

    // Process each follow-up
    for (const followUp of sortedFollowUps) {
      // CRITICAL FIX: Create a unique key that preserves multi-step sequences
      // Include sequence info to prevent different steps from being treated as duplicates
      const key = `${followUp.patient_id}|${followUp.based_on_appointment_id || ''}|${followUp.follow_up_sequence || 1}|${followUp.sequence_group_id || followUp.suggested_service_name}`;

      // Only add if we haven't seen this combination before
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, followUp);
      }
    }

    // Get unique follow-ups
    const uniqueFollowUps = Array.from(uniqueMap.values());

    // Sort the deduplicated follow-ups by tentative_date for stable display order
    return uniqueFollowUps.sort((a, b) => {
      // Primary sort by tentative_date
      const dateA = new Date(a.tentative_date).getTime();
      const dateB = new Date(b.tentative_date).getTime();

      if (dateA !== dateB) {
        return dateA - dateB; // Earliest first
      }

      // Secondary sort by patient name
      if (a.patient_name !== b.patient_name) {
        return a.patient_name.localeCompare(b.patient_name);
      }

      // Tertiary sort by service name
      if (a.suggested_service_name !== b.suggested_service_name) {
        return a.suggested_service_name.localeCompare(b.suggested_service_name);
      }

      // Final sort by ID for absolute stability
      return (a.id || '').localeCompare(b.id || '');
    });
  };

  // State for directly queried waiting follow-ups
  const [directWaitingFollowUps, setDirectWaitingFollowUps] = useState<FollowUp[]>([]);

  // Function to create follow-ups from existing dental history
  const createFollowUpsFromDentalHistory = async () => {
    try {
      console.log('RecallList: Creating follow-ups from existing dental history...');

      // First, check if follow_ups table exists and is accessible
      try {
        const testQuery = await supabase.from('follow_ups').getAll({ limit: 1 });
        console.log('Follow_ups table is accessible:', testQuery !== null);
      } catch (tableError) {
        console.error('Follow_ups table access error:', tableError);
        return;
      }

      // Get all dental history entries
      const historyData = await supabase.from('dental_history').getAll({
        order: { column: 'date', ascending: false },
        limit: 50
      });

      if (!historyData || historyData.length === 0) {
        console.log('No dental history entries found');

        // Create some test dental history entries if none exist
        console.log('Creating test dental history entries...');
        const testEntries = [
          {
            appointment_id: 'test-001',
            patient_id: 'PT001',
            date: '2024-01-15',
            service: 'General Checkup',
            doctor: 'Dr. Smith',
            payment_status: 'paid',
            diagnosis_notes: 'Routine checkup completed',
            treatment_plan_suggested: 'Regular cleaning in 6 months',
            procedure_performed_notes: 'Full examination completed'
          },
          {
            appointment_id: 'test-002',
            patient_id: 'PT002',
            date: '2024-01-20',
            service: 'Teeth Cleaning',
            doctor: 'Dr. Johnson',
            payment_status: 'paid',
            diagnosis_notes: 'Plaque removal completed',
            treatment_plan_suggested: 'Follow-up cleaning in 6 months',
            procedure_performed_notes: 'Deep cleaning performed'
          }
        ];

        for (const entry of testEntries) {
          try {
            await supabase.from('dental_history').insert(entry);
            console.log(`Created test dental history entry for ${entry.service}`);
          } catch (insertError) {
            console.error('Error creating test dental history:', insertError);
          }
        }

        // Re-fetch after creating test data
        const newHistoryData = await supabase.from('dental_history').getAll({
          order: { column: 'date', ascending: false },
          limit: 50
        });

        if (!newHistoryData || newHistoryData.length === 0) {
          console.log('Still no dental history entries after creating test data');
          return;
        }

        console.log(`Now found ${newHistoryData.length} dental history entries after creating test data`);
      }

      console.log(`Found ${historyData?.length || 0} dental history entries`);

      // Create follow-ups directly using Supabase
      const entriesToProcess = historyData || [];

      for (const entry of entriesToProcess) {
        try {
          console.log(`Processing entry: ${entry.service} for patient ${entry.patient_id}`);

          // Check if follow-up already exists
          const existingFollowUps = await supabase.from('follow_ups').getAll({
            filters: {
              patient_id: entry.patient_id,
              original_service: entry.service
            }
          });

          if (existingFollowUps && existingFollowUps.length > 0) {
            console.log(`Follow-up already exists for ${entry.service}`);
            continue;
          }

          // CRITICAL FIX: Get real patient info and validate patient_id is UUID
          let validPatientId = entry.patient_id;
          let patientName = 'Unknown Patient';

          // Check if patient_id is a valid UUID
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.patient_id)) {
            console.log(`Patient ID "${entry.patient_id}" is not a UUID, trying to find real patient...`);

            // Try to find a real patient from the database
            const allPatients = await supabase.from('patients').getAll({ limit: 10 });
            if (allPatients && allPatients.length > 0) {
              const realPatient = allPatients[0];
              validPatientId = realPatient.id;
              patientName = realPatient.name || 'Real Patient';
              console.log(`Using real patient: ${patientName} (${validPatientId})`);
            } else {
              console.log(`No real patients found, skipping entry for ${entry.service}`);
              continue;
            }
          } else {
            // Get patient name for valid UUID
            const patients = await supabase.from('patients').getAll({
              filters: { id: entry.patient_id }
            });
            patientName = patients && patients.length > 0 ? patients[0].name : 'Unknown Patient';
          }

          // CRITICAL FIX: Get actual service follow-up rule days - NO DEFAULT FALLBACK
          console.log(`Looking up follow-up rules for service: "${entry.service}"`);

          let intervalDays = null; // No default - only create if rule exists
          let suggestedServiceName = entry.service;
          let ruleFound = false;

          try {
            // CRITICAL DEBUG: First, let's see what we're working with
            console.log('=== DEBUGGING SERVICE RULE MATCHING ===');
            console.log(`Dental history service name: "${entry.service}"`);

            // CRITICAL FIX: Get ALL available service rules from the CORRECT table
            const allRules = await supabase.from('service_follow_up_rules').getAll();
            console.log('All available service follow-up rules:', allRules?.map(r => ({
              rule_id: r.rule_id,
              triggering_service_name: r.triggering_service_name,
              service_id: r.service_id
            })));

            // Try multiple approaches to find the service rule
            console.log('Method 1: Exact triggering_service_name match...');
            let serviceRules = await supabase.from('service_follow_up_rules').getAll({
              filters: { triggering_service_name: entry.service }
            });
            console.log(`Exact match result:`, serviceRules);

            // If exact match fails, try case-insensitive search
            if (!serviceRules || serviceRules.length === 0) {
              console.log('Method 2: Case-insensitive search...');
              serviceRules = allRules.filter(rule =>
                rule.triggering_service_name && rule.triggering_service_name.toLowerCase() === entry.service.toLowerCase()
              );
              console.log(`Case-insensitive match result:`, serviceRules);
            }

            // If still no match, try partial match
            if (!serviceRules || serviceRules.length === 0) {
              console.log('Method 3: Partial match search...');
              serviceRules = allRules.filter(rule =>
                rule.triggering_service_name && (
                  rule.triggering_service_name.toLowerCase().includes(entry.service.toLowerCase()) ||
                  entry.service.toLowerCase().includes(rule.triggering_service_name.toLowerCase())
                )
              );
              console.log(`Partial match result:`, serviceRules);
            }

            console.log(`Final result: Found ${serviceRules?.length || 0} potential service rules:`, serviceRules);

            if (serviceRules && serviceRules.length > 0) {
              const rule = serviceRules[0];
              console.log('Found service follow-up rule:', rule);

              // Now get the follow-up steps for this rule
              console.log(`Fetching follow-up steps for rule ID: ${rule.id}`);
              const followUpSteps = await supabase.from('follow_up_steps').getAll({
                filters: { service_follow_up_rule_id: rule.id },
                order: { column: 'sequence', ascending: true }
              });

              console.log(`Found ${followUpSteps?.length || 0} follow-up steps:`, followUpSteps);

              if (followUpSteps && followUpSteps.length > 0) {
                // Use the first step for now (sequence 1)
                const firstStep = followUpSteps[0];
                intervalDays = firstStep.interval_days;
                suggestedServiceName = firstStep.suggested_service_name || entry.service;
                ruleFound = true;
                console.log(`✅ Found service rule with steps: ${intervalDays} days for "${entry.service}" (step 1 of ${followUpSteps.length})`);
              } else {
                console.log(`❌ Service rule found but no follow-up steps configured:`, rule);
              }
            } else {
              console.log(`❌ No service rule found for "${entry.service}"`);
            }
          } catch (ruleError) {
            console.error('Error fetching service rules:', ruleError);
          }

          // CRITICAL FIX: Create follow-up with smart matching and fallback
          if (!ruleFound || intervalDays === null || intervalDays <= 0) {
            console.log(`⚠️ No exact rule found for "${entry.service}"`);

            // Try to find ANY rule that might be related
            const allRules = await supabase.from('service_follow_up_rules').getAll();
            console.log('All available rules for smart matching:', allRules?.map(r => r.triggering_service_name));

            // Smart matching: look for common dental services
            const commonMatches = {
              'mouth': ['Mouth', 'General Checkup', 'Dental Checkup'],
              'rehab': ['Rehab', 'Rehabilitation', 'Follow Up'],
              'checkup': ['General Checkup', 'Dental Checkup', 'Mouth'],
              'cleaning': ['Teeth Cleaning', 'Dental Cleaning'],
              'consultation': ['Consultation', 'General Checkup']
            };

            let matchedRule = null;
            const serviceLower = entry.service.toLowerCase();

            // Try smart matching
            for (const [keyword, possibleMatches] of Object.entries(commonMatches)) {
              if (serviceLower.includes(keyword)) {
                for (const match of possibleMatches) {
                  const rule = allRules?.find(r => r.triggering_service_name === match);
                  if (rule) {
                    console.log(`🎯 Smart match found: "${entry.service}" → "${rule.triggering_service_name}"`);
                    matchedRule = rule;
                    break;
                  }
                }
                if (matchedRule) break;
              }
            }

            if (matchedRule) {
              // Get steps for the matched rule
              const matchedSteps = await supabase.from('follow_up_steps').getAll({
                filters: { service_follow_up_rule_id: matchedRule.id },
                order: { column: 'sequence', ascending: true }
              });

              if (matchedSteps && matchedSteps.length > 0) {
                const firstStep = matchedSteps[0];
                intervalDays = firstStep.interval_days;
                suggestedServiceName = firstStep.suggested_service_name || entry.service;
                ruleFound = true;
                console.log(`✅ Using smart-matched rule: ${intervalDays} days for "${entry.service}" via "${matchedRule.triggering_service_name}"`);
              }
            }

            // Final fallback: create with reasonable defaults for dental services
            if (!ruleFound) {
              console.log(`🔧 No rules found, using intelligent defaults for "${entry.service}"`);

              // Intelligent defaults based on service type
              if (serviceLower.includes('checkup') || serviceLower.includes('examination')) {
                intervalDays = 180; // 6 months for checkups
              } else if (serviceLower.includes('cleaning')) {
                intervalDays = 180; // 6 months for cleaning
              } else if (serviceLower.includes('filling') || serviceLower.includes('restoration')) {
                intervalDays = 365; // 1 year for fillings
              } else if (serviceLower.includes('root canal') || serviceLower.includes('endodontic')) {
                intervalDays = 90; // 3 months for root canal follow-up
              } else {
                intervalDays = 180; // Default 6 months for other services
              }

              suggestedServiceName = entry.service;
              console.log(`🔧 Using intelligent default: ${intervalDays} days for "${entry.service}"`);
            }
          }

          // Create follow-up directly with calculated interval
          const followUpId = `FU${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const appointmentDate = new Date(entry.date);
          const followUpDate = new Date(appointmentDate);
          followUpDate.setDate(followUpDate.getDate() + intervalDays); // Use actual rule days

          const newFollowUp = {
            follow_up_id: followUpId,
            patient_id: validPatientId, // Use validated UUID
            patient_name: patientName,
            based_on_appointment_id: null, // Set to null for non-UUID appointment IDs
            tentative_date: followUpDate.toISOString().split('T')[0],
            follow_up_sequence: 1,
            total_steps_in_sequence: 1,
            sequence_group_id: `seq-${Date.now()}`,
            suggested_service_name: suggestedServiceName, // Use rule's suggested service
            original_service: entry.service,
            original_doctor: entry.doctor,
            status: 'Pending'
          };

          console.log(`Creating follow-up with ${intervalDays} days interval (due: ${newFollowUp.tentative_date}):`, newFollowUp);

          const insertedFollowUp = await supabase.from('follow_ups').insert(newFollowUp);

          if (insertedFollowUp) {
            console.log(`✅ Successfully created follow-up for ${patientName}'s ${entry.service}`);
          } else {
            console.log(`❌ Failed to create follow-up for ${patientName}'s ${entry.service}`);
          }

        } catch (entryError) {
          console.error(`Error processing dental history entry ${entry.id}:`, entryError);
        }
      }

      console.log('Finished creating follow-ups from dental history');
    } catch (error) {
      console.error('Error creating follow-ups from dental history:', error);
    }
  };

  // Function to directly query waiting follow-ups
  const fetchWaitingFollowUpsDirectly = async () => {
    try {
      console.log('Directly querying waiting follow-ups...');
      // Use the custom Supabase client implementation with getAll
      const waitingData = await supabase.from<FollowUp>('follow_ups').getAll({
        filters: { status: 'Waiting' },
        order: { column: 'tentative_date', ascending: true }
      });

      console.log(`Directly fetched ${waitingData?.length || 0} waiting follow-ups`);
      if (waitingData && waitingData.length > 0) {
        console.log('Direct waiting follow-ups:', waitingData.map(f => ({
          id: f.id,
          patient: f.patient_name,
          status: f.status,
          sequence: `${f.follow_up_sequence}/${f.total_steps_in_sequence}`,
          date: f.tentative_date
        })));
        setDirectWaitingFollowUps(waitingData);
      } else {
        console.log('No waiting follow-ups found directly');
        setDirectWaitingFollowUps([]);
      }
    } catch (error) {
      console.error('Exception fetching waiting follow-ups directly:', error);
    }
  };

  // Fetch waiting follow-ups when tab changes
  useEffect(() => {
    if (activeTab === 'waiting') {
      fetchWaitingFollowUpsDirectly();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // EMERGENCY FIX: Removed function dependency to prevent loops

  // Calculate filtered counts for each tab (respecting clinic context)
  const filteredCounts = useMemo(() => {
    const filterFollowUpsByClinic = (followUpsToFilter: FollowUp[]) => {
      if (activeClinic === 'dental' || activeClinic === 'meditouch') {
        // Get current clinic's service names
        const currentClinicServices = activeClinic === 'dental' ? dentalServices : meditouchServices;
        const currentClinicServiceNames = currentClinicServices.map(s => s.name);

        return followUpsToFilter.filter(followUp => {
          // Check if the original service or suggested service belongs to current clinic
          const originalServiceMatch = currentClinicServiceNames.includes(followUp.original_service);
          const suggestedServiceMatch = currentClinicServiceNames.includes(followUp.suggested_service_name);

          // Include if either original or suggested service belongs to current clinic
          return originalServiceMatch || suggestedServiceMatch;
        });
      }
      return followUpsToFilter;
    };

    const pendingCount = filterFollowUpsByClinic(getPendingFollowUps()).length;
    const waitingCount = filterFollowUpsByClinic(
      directWaitingFollowUps.length > 0 ? directWaitingFollowUps : getWaitingFollowUps()
    ).length;
    const snoozedCount = filterFollowUpsByClinic(getSnoozedFollowUps()).length;

    return { pendingCount, waitingCount, snoozedCount };
  }, [getPendingFollowUps, getWaitingFollowUps, getSnoozedFollowUps, directWaitingFollowUps, activeClinic, dentalServices, meditouchServices]);

  // Filter and sort follow-ups
  const filteredAndSortedFollowUps = useMemo(() => {
    const today = new Date();
    console.log('Filtering and sorting follow-ups...');

    // Select the appropriate follow-ups based on the active tab
    let followUpsToFilter;
    if (activeTab === 'pending') {
      followUpsToFilter = getPendingFollowUps();
    } else if (activeTab === 'snoozed') {
      followUpsToFilter = getSnoozedFollowUps();
    } else if (activeTab === 'waiting') {
      // Use directly queried waiting follow-ups if available, otherwise fall back to context
      followUpsToFilter = directWaitingFollowUps.length > 0
        ? directWaitingFollowUps
        : getWaitingFollowUps();
    } else {
      followUpsToFilter = getPendingFollowUps(); // Default to pending
    }

    // Deduplicate follow-ups
    followUpsToFilter = deduplicateFollowUps(followUpsToFilter);
    console.log(`Selected ${followUpsToFilter.length} deduplicated follow-ups for filtering based on tab: ${activeTab}`);

    // Filter by search term
    let filtered = followUpsToFilter.filter(followUp => {
      const searchLower = searchTerm.toLowerCase();
      return (
        followUp.patient_name.toLowerCase().includes(searchLower) ||
        followUp.suggested_service_name.toLowerCase().includes(searchLower) ||
        followUp.original_service.toLowerCase().includes(searchLower) ||
        followUp.original_doctor.toLowerCase().includes(searchLower) ||
        (followUp.special_notes && followUp.special_notes.toLowerCase().includes(searchLower))
      );
    });

    // Filter by service clinic type based on active clinic
    console.log(`=== SERVICE CLINIC FILTERING DEBUG ===`);
    console.log(`Active clinic: ${activeClinic}`);
    console.log(`Total follow-ups before clinic filtering: ${filtered.length}`);
    console.log(`Dental services: ${dentalServices.map(s => s.name).join(', ')}`);
    console.log(`Meditouch services: ${meditouchServices.map(s => s.name).join(', ')}`);

    if (activeClinic === 'dental' || activeClinic === 'meditouch') {
      // Get current clinic's service names
      const currentClinicServices = activeClinic === 'dental' ? dentalServices : meditouchServices;
      const currentClinicServiceNames = currentClinicServices.map(s => s.name);

      console.log(`Current clinic (${activeClinic}) services:`, currentClinicServiceNames);

      filtered = filtered.filter(followUp => {
        // Check if the original service or suggested service belongs to current clinic
        const originalServiceMatch = currentClinicServiceNames.includes(followUp.original_service);
        const suggestedServiceMatch = currentClinicServiceNames.includes(followUp.suggested_service_name);

        // Include if either original or suggested service belongs to current clinic
        const shouldInclude = originalServiceMatch || suggestedServiceMatch;

        console.log(`Follow-up: ${followUp.patient_name}, Original: ${followUp.original_service}, Suggested: ${followUp.suggested_service_name}, Include: ${shouldInclude}`);

        return shouldInclude;
      });
    }

    console.log(`Total follow-ups after service clinic filtering: ${filtered.length}`);

    // Filter by status (only for pending tab)
    if (activeTab === 'pending' && filterStatus !== 'all') {
      filtered = filtered.filter(followUp => {
        const followUpDate = parseISO(followUp.tentative_date);
        if (filterStatus === 'upcoming') {
          return isAfter(followUpDate, today) || format(followUpDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        } else if (filterStatus === 'overdue') {
          return isBefore(followUpDate, today) && format(followUpDate, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd');
        }
        return true;
      });
    }

    // Filter by sequence group if selected
    if (selectedSequenceId) {
      filtered = filtered.filter(followUp => followUp.sequence_group_id === selectedSequenceId);
    }

    // Sort the filtered follow-ups with multiple stable sort criteria
    console.log(`Sorting by ${sortBy} in ${sortOrder} order`);

    return filtered.sort((a, b) => {
      // Primary sort by the selected column
      if (sortBy === 'date') {
        const dateA = parseISO(a.tentative_date);
        const dateB = parseISO(b.tentative_date);

        if (dateA.getTime() !== dateB.getTime()) {
          // For date sorting: asc = earliest first, desc = latest first
          return sortOrder === 'asc'
            ? dateA.getTime() - dateB.getTime() // Ascending: earliest dates first
            : dateB.getTime() - dateA.getTime(); // Descending: latest dates first
        }
      } else {
        // Sort by patient name
        const nameCompare = a.patient_name.localeCompare(b.patient_name);
        if (nameCompare !== 0) {
          return sortOrder === 'asc'
            ? nameCompare // A to Z
            : -nameCompare; // Z to A
        }
      }

      // Secondary sort criteria (if primary criteria are equal)

      // If we're sorting by patient, use date as secondary
      if (sortBy === 'patient') {
        const dateA = parseISO(a.tentative_date);
        const dateB = parseISO(b.tentative_date);

        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime(); // Always earliest first for secondary
        }
      }

      // If we're sorting by date, use patient name as secondary
      if (sortBy === 'date') {
        const nameCompare = a.patient_name.localeCompare(b.patient_name);
        if (nameCompare !== 0) {
          return nameCompare; // Always A-Z for secondary
        }
      }

      // Tertiary sort by service name
      const serviceCompare = a.suggested_service_name.localeCompare(b.suggested_service_name);
      if (serviceCompare !== 0) {
        return serviceCompare;
      }

      // Final sort by ID for absolute stability
      return (a.id || '').localeCompare(b.id || '');
    });
  }, [
    activeTab,
    getPendingFollowUps,
    getSnoozedFollowUps,
    getWaitingFollowUps,
    directWaitingFollowUps,
    searchTerm,
    filterStatus,
    selectedSequenceId,
    sortBy,
    sortOrder,
    activeClinic,
    dentalServices,
    meditouchServices
  ]);

  // Toggle sort order
  const toggleSort = (field: 'date' | 'patient') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle viewing all follow-ups in a sequence
  const handleViewSequence = (sequenceGroupId: string) => {
    setSelectedSequenceId(sequenceGroupId);

    // Show toast notification
    toast({
      title: "Sequence Filter Applied",
      description: "Showing all follow-ups in this sequence. Click 'Clear Sequence Filter' to show all follow-ups again.",
    });
  };

  // Handle clearing the sequence filter
  const handleClearSequenceFilter = () => {
    setSelectedSequenceId(null);

    // Show toast notification
    toast({
      title: "Sequence Filter Cleared",
      description: "Showing all follow-ups.",
    });
  };

  // Handle scheduling an appointment for a follow-up
  const handleScheduleAppointment = (followUp: FollowUp) => {
    console.log('🔄 Schedule button clicked for follow-up:', followUp);

    // Navigate to appointments page first (like the global New Appointment button)
    console.log('🔄 Navigating to /appointments...');
    navigate('/appointments');

    // Use a timeout to ensure we're on the appointments page before dispatching the event
    setTimeout(() => {
      console.log('🔄 Timeout reached, dispatching event...');

      // Dispatch custom event to open appointment form with pre-filled data
      const eventData = {
        patientName: followUp.patient_name,
        patientId: followUp.patient_id,
        serviceName: followUp.suggested_service_name,
        doctorName: followUp.original_doctor,
        date: followUp.tentative_date,
        followUpId: followUp.id,
        notes: `Follow-up appointment for ${followUp.original_service}${followUp.special_notes ? ` - ${followUp.special_notes}` : ''}`
      };

      console.log('🔄 Event data:', eventData);

      const event = new CustomEvent('openNewAppointmentFormWithData', {
        detail: eventData
      });

      console.log('🔄 Dispatching event to document...');
      document.dispatchEvent(event);
      console.log('✅ Event dispatched successfully!');

      // Also try dispatching to window as backup
      window.dispatchEvent(event);
      console.log('✅ Event also dispatched to window as backup!');
    }, 300); // Increased timeout to ensure page is fully loaded
  };

  // Handle viewing details of a follow-up
  const handleViewDetails = (followUp: FollowUp) => {
    setDetailsFollowUp(followUp);
    setIsDetailsDialogOpen(true);
  };

  // Handle opening the snooze dialog
  const handleOpenSnoozeDialog = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setSnoozeDate(addMonths(new Date(), 1)); // Default to 1 month from now
    setSnoozeNotes(followUp.special_notes || '');
    setIsSnoozeDialogOpen(true);
  };

  // Handle snoozing a follow-up
  const handleSnoozeFollowUp = async () => {
    if (!selectedFollowUp || !snoozeDate) return;

    try {
      const formattedDate = format(snoozeDate, 'yyyy-MM-dd');
      await snoozeFollowUp(selectedFollowUp.id, formattedDate, snoozeNotes);

      // Check if this is part of a sequence
      const isPartOfSequence = selectedFollowUp.sequence_group_id &&
                              selectedFollowUp.total_steps_in_sequence > 1 &&
                              selectedFollowUp.follow_up_sequence < selectedFollowUp.total_steps_in_sequence;

      // Show appropriate toast message
      if (isPartOfSequence) {
        toast({
          title: "Follow-up Sequence Updated",
          description: `Follow-up for ${selectedFollowUp.patient_name} has been snoozed until ${format(snoozeDate, 'MMM d, yyyy')}. All subsequent steps in this sequence have been rescheduled accordingly.`,
        });
      } else {
        toast({
          title: "Follow-up Snoozed",
          description: `Follow-up for ${selectedFollowUp.patient_name} has been snoozed until ${format(snoozeDate, 'MMM d, yyyy')}.`,
        });
      }

      setIsSnoozeDialogOpen(false);
      fetchFollowUps();
    } catch (error) {
      console.error('Error snoozing follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to snooze follow-up. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle unsnoozing a follow-up
  const handleUnsnoozeFollowUp = async (followUp: FollowUp) => {
    try {
      await activateFollowUp(followUp.id);

      // Check if this is part of a sequence
      const isPartOfSequence = followUp.sequence_group_id &&
                              followUp.total_steps_in_sequence > 1 &&
                              followUp.follow_up_sequence < followUp.total_steps_in_sequence;

      // Show appropriate toast message
      if (isPartOfSequence) {
        toast({
          title: "Follow-up Activated",
          description: `Follow-up for ${followUp.patient_name} has been moved back to the pending list. Note that subsequent steps in the sequence may still need to be adjusted.`,
        });
      } else {
        toast({
          title: "Follow-up Activated",
          description: `Follow-up for ${followUp.patient_name} has been moved back to the pending list.`,
        });
      }

      fetchFollowUps();
    } catch (error) {
      console.error('Error activating follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate follow-up. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle opening delete confirmation dialog
  const handleDeleteFollowUp = (followUp: FollowUp) => {
    setFollowUpToDelete(followUp);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirming the delete action
  const confirmDeleteFollowUp = async () => {
    if (!followUpToDelete) return;

    try {
      console.log('Deleting follow-up:', followUpToDelete);

      // Delete the current follow-up
      const success = await deleteFollowUp(followUpToDelete.id);

      if (success) {
        // Check if this is part of a sequence and activate the next step
        if (followUpToDelete.sequence_group_id &&
            followUpToDelete.follow_up_sequence < followUpToDelete.total_steps_in_sequence) {

          console.log(`Looking for next step in sequence ${followUpToDelete.sequence_group_id}`);

          // Find the next step in the sequence
          const nextStepFollowUps = followUps.filter(f =>
            f.sequence_group_id === followUpToDelete.sequence_group_id &&
            f.follow_up_sequence === followUpToDelete.follow_up_sequence + 1 &&
            f.status === 'Waiting'
          );

          console.log(`Found ${nextStepFollowUps.length} next steps in the sequence`);

          // If we found the next step, update its status to Pending
          if (nextStepFollowUps.length > 0) {
            const nextStep = nextStepFollowUps[0];
            console.log('Activating next step:', nextStep);

            await updateFollowUp(nextStep.id, {
              status: 'Pending'
            });

            // Refresh the follow-ups list
            await fetchFollowUps();

            toast({
              title: "Follow-up Deleted",
              description: `Step ${followUpToDelete.follow_up_sequence} deleted. Step ${nextStep.follow_up_sequence} is now pending.`,
            });
          } else {
            toast({
              title: "Follow-up Deleted",
              description: `${followUpToDelete.patient_name}'s follow-up has been deleted.`,
            });
          }
        } else {
          toast({
            title: "Follow-up Deleted",
            description: `${followUpToDelete.patient_name}'s follow-up has been deleted.`,
          });
        }
      }
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to delete follow-up. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Close the dialog and reset state
      setIsDeleteDialogOpen(false);
      setFollowUpToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Recall List</h1>
          <p className="text-muted-foreground">
            Manage follow-up appointments and patient recalls
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="hidden" // HIDDEN: User requested to hide this button but keep functionality
            onClick={async () => {
              toast({
                title: "Refreshing Follow-ups",
                description: "Loading follow-ups and checking for missing ones...",
              });

              // CRITICAL FIX: DISABLE automatic follow-up creation
              // Follow-ups should ONLY be created when appointments are marked as completed
              console.log('Automatic follow-up creation DISABLED - follow-ups are created only when appointments are completed');
              // await createMissingFollowUps(); // DISABLED
              // await createFollowUpsFromDentalHistory(); // DISABLED

              // Refresh all follow-ups
              await fetchFollowUps();

              // Also directly fetch waiting follow-ups
              await fetchWaitingFollowUpsDirectly();

              // Debug: Log follow-ups by status
              const statusCounts = {};
              followUps.forEach(f => {
                statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
              });
              console.log('Follow-ups by status:', statusCounts);

              // Check for any with Waiting status
              const waitingFollowUps = followUps.filter(f => f.status === 'Waiting');
              console.log(`Found ${waitingFollowUps.length} follow-ups with Waiting status in context:`,
                waitingFollowUps.map(f => ({
                  id: f.id,
                  patient: f.patient_name,
                  sequence: `${f.follow_up_sequence}/${f.total_steps_in_sequence}`,
                  date: f.tentative_date
                }))
              );

              console.log(`Found ${directWaitingFollowUps.length} waiting follow-ups directly from database`);

              toast({
                title: "Follow-ups Refreshed",
                description: `Found ${followUps.length} follow-ups (${directWaitingFollowUps.length} waiting).`,
              });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh & Create Missing
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Tentative Follow-ups</CardTitle>
              <CardDescription>
                Patients due for follow-up appointments based on previous treatments
              </CardDescription>
            </div>
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={activeTab === 'pending' ? 'default' : 'ghost'}
                className={`rounded-none ${activeTab === 'pending' ? '' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({filteredCounts.pendingCount})
              </Button>
              <Button
                variant={activeTab === 'waiting' ? 'default' : 'ghost'}
                className={`rounded-none ${activeTab === 'waiting' ? '' : 'hover:bg-gray-100'}`}
                onClick={async () => {
                  console.log('Switching to waiting tab');

                  // Directly fetch waiting follow-ups
                  await fetchWaitingFollowUpsDirectly();

                  // Debug: Log all follow-ups to see what we have
                  console.log('All follow-ups:', followUps.map(f => ({
                    id: f.id,
                    patient: f.patient_name,
                    status: f.status,
                    sequence: `${f.follow_up_sequence}/${f.total_steps_in_sequence}`,
                    date: f.tentative_date
                  })));

                  // Debug: Log waiting follow-ups specifically
                  const waitingFollowUps = followUps.filter(f => f.status === 'Waiting');
                  console.log('Waiting follow-ups count in context:', waitingFollowUps.length);

                  // Debug: Check direct waiting follow-ups
                  console.log('Direct waiting follow-ups count:', directWaitingFollowUps.length);

                  setActiveTab('waiting');
                }}
              >
                Waiting ({filteredCounts.waitingCount})
              </Button>
              <Button
                variant={activeTab === 'snoozed' ? 'default' : 'ghost'}
                className={`rounded-none ${activeTab === 'snoozed' ? '' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('snoozed')}
              >
                Snoozed ({filteredCounts.snoozedCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients, services..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeTab === 'pending' ? (
              <Select
                value={filterStatus}
                onValueChange={(value: string) => setFilterStatus(value as 'all' | 'upcoming' | 'overdue')}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Follow-ups</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="w-full md:w-[180px] opacity-50">
                <Button variant="outline" disabled className="w-full justify-start text-left">
                  <Filter className="mr-2 h-4 w-4" />
                  <span className="text-muted-foreground">Status filters not applicable</span>
                </Button>
              </div>
            )}

            {selectedSequenceId && (
              <Button
                variant="outline"
                onClick={handleClearSequenceFilter}
                className="w-full md:w-auto"
              >
                Clear Sequence Filter
              </Button>
            )}
          </div>

          {filteredAndSortedFollowUps.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort('patient')}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Patient {sortBy === 'patient' && (sortOrder === 'asc' ? '(A-Z)' : '(Z-A)')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort('date')}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Tentative Date {sortBy === 'date' && (sortOrder === 'asc' ? '(Earliest First)' : '(Latest First)')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Suggested Service</TableHead>
                    <TableHead>Original Service</TableHead>
                    <TableHead>Original Doctor</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedFollowUps.map((followUp) => {
                    const followUpDate = parseISO(followUp.tentative_date);
                    // Only show as overdue if it's in the pending tab and the date is in the past
                    const isOverdue = activeTab === 'pending' && isBefore(followUpDate, new Date());

                    // Create a stable compound key for the row
                    const stableKey = `${followUp.id}-${followUp.patient_id}-${followUp.tentative_date}`;

                    return (
                      <TableRow key={stableKey}>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="font-medium">{followUp.patient_name}</span>
                            {followUp.sequence_group_id && followUp.total_steps_in_sequence > 1 && (
                              <Badge
                                variant={followUp.status === 'Waiting' ? 'secondary' : 'outline'}
                                className={`ml-2 ${
                                  followUp.status === 'Waiting'
                                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                Step {followUp.follow_up_sequence}/{followUp.total_steps_in_sequence}
                                {followUp.status === 'Waiting' && ' (Waiting)'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {format(followUpDate, 'MMM d, yyyy')}
                            </span>
                            {isOverdue && (
                              <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                                Overdue
                              </Badge>
                            )}
                            {activeTab === 'snoozed' && followUp.snoozed_until && (
                              <div className="ml-2 text-xs text-muted-foreground">
                                Snoozed until {format(parseISO(followUp.snoozed_until), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{followUp.suggested_service_name}</TableCell>
                        <TableCell>{followUp.original_service}</TableCell>
                        <TableCell>{followUp.original_doctor}</TableCell>
                        <TableCell>
                          {followUp.special_notes ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Notes</h4>
                                  <p className="text-sm">{followUp.special_notes}</p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(followUp)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            {activeTab === 'pending' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`${
                                    activeClinic === 'dental'
                                      ? 'text-dental-primary hover:bg-dental-50 hover:text-dental-dark'
                                      : 'text-meditouch-primary hover:bg-meditouch-50 hover:text-meditouch-dark'
                                  }`}
                                  onClick={() => handleScheduleAppointment(followUp)}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Schedule
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenSnoozeDialog(followUp)}
                                >
                                  <AlarmClock className="mr-2 h-4 w-4" />
                                  Snooze
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleDeleteFollowUp(followUp)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : activeTab === 'waiting' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Activate the waiting follow-up
                                    activateFollowUp(followUp.id).then(() => {
                                      toast({
                                        title: "Follow-up Activated",
                                        description: `Step ${followUp.follow_up_sequence} for ${followUp.patient_name} has been activated and moved to the pending list.`,
                                      });
                                      fetchFollowUps();
                                    });
                                  }}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Activate Early
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleDeleteFollowUp(followUp)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnsnoozeFollowUp(followUp)}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Activate
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleDeleteFollowUp(followUp)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {activeTab === 'pending'
                  ? 'No pending follow-ups'
                  : activeTab === 'waiting'
                    ? 'No waiting follow-ups'
                    : 'No snoozed follow-ups'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {activeTab === 'pending'
                  ? 'There are no pending follow-ups that match your filters.'
                  : activeTab === 'waiting'
                    ? 'There are no waiting follow-ups. Waiting follow-ups are future steps in a sequence that will become active when previous steps are completed.'
                    : 'There are no snoozed follow-ups. When you snooze a follow-up, it will appear here.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snooze Dialog */}
      <Dialog open={isSnoozeDialogOpen} onOpenChange={setIsSnoozeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Snooze Follow-up</DialogTitle>
            <DialogDescription>
              Temporarily hide this follow-up until the patient is available.
              {selectedFollowUp && selectedFollowUp.sequence_group_id && selectedFollowUp.total_steps_in_sequence > 1 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                  <strong>Note:</strong> This follow-up is step {selectedFollowUp.follow_up_sequence} of {selectedFollowUp.total_steps_in_sequence} in a sequence.
                  {selectedFollowUp.follow_up_sequence < selectedFollowUp.total_steps_in_sequence && (
                    <span> All subsequent steps will also be rescheduled accordingly.</span>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="snooze-date">Snooze Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="snooze-date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {snoozeDate ? format(snoozeDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={snoozeDate}
                    onSelect={setSnoozeDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="special-notes">Special Notes</Label>
              <Textarea
                id="special-notes"
                placeholder="Add notes about patient availability (e.g., 'Patient traveling until January')"
                value={snoozeNotes}
                onChange={(e) => setSnoozeNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSnoozeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSnoozeFollowUp} disabled={!snoozeDate}>
              Snooze Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Follow-up Details</DialogTitle>
          </DialogHeader>
          {detailsFollowUp && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Patient</h4>
                  <p>{detailsFollowUp.patient_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
                  <p>{format(parseISO(detailsFollowUp.tentative_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Suggested Service</h4>
                  <p>{detailsFollowUp.suggested_service_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Original Service</h4>
                  <p>{detailsFollowUp.original_service}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Original Doctor</h4>
                  <p>{detailsFollowUp.original_doctor}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p>{detailsFollowUp.status}</p>
                </div>
                {detailsFollowUp.follow_up_type && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                    <p>{detailsFollowUp.follow_up_type}</p>
                  </div>
                )}
                {detailsFollowUp.sequence_group_id && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Sequence</h4>
                    <p>Step {detailsFollowUp.follow_up_sequence} of {detailsFollowUp.total_steps_in_sequence}</p>
                  </div>
                )}
                {detailsFollowUp.snoozed_until && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Snoozed Until</h4>
                    <p>{format(parseISO(detailsFollowUp.snoozed_until), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </div>
              {detailsFollowUp.special_notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                  <p className="text-sm mt-1">{detailsFollowUp.special_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Follow-up</AlertDialogTitle>
            <AlertDialogDescription>
              {followUpToDelete && (
                <>
                  Are you sure you want to delete this follow-up for <strong>{followUpToDelete.patient_name}</strong>?
                  <br />
                  <br />
                  <strong>Service:</strong> {followUpToDelete.suggested_service_name}
                  <br />
                  <strong>Date:</strong> {format(parseISO(followUpToDelete.tentative_date), 'MMM d, yyyy')}
                  {followUpToDelete.follow_up_sequence > 1 && (
                    <>
                      <br />
                      <strong>Step:</strong> {followUpToDelete.follow_up_sequence} of {followUpToDelete.total_steps_in_sequence}
                    </>
                  )}
                  <br />
                  <br />
                  {followUpToDelete.sequence_group_id &&
                   followUpToDelete.follow_up_sequence < followUpToDelete.total_steps_in_sequence && (
                    <span className="text-sm text-muted-foreground">
                      Note: The next step in this sequence will automatically become pending.
                    </span>
                  )}
                  <br />
                  <strong>This action cannot be undone.</strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFollowUp}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Follow-up
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecallList;
