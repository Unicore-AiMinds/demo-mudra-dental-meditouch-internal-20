import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useServices } from '@/contexts/ServiceContext';
import { ServiceFollowUpRule, FollowUpStep } from '@/types/dental-history';
import { v4 as uuidv4 } from 'uuid';

// Supabase configuration - same as in supabase.ts
const SUPABASE_URL = 'https://otvhtpnmunoazgqhennu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dmh0cG5tdW5vYXpncWhlbm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MDEwMTAsImV4cCI6MjA2MjE3NzAxMH0.TeZa-YGzfToszrWrMomsjw3R9mRxFR-7NE7sNLFi9JM';

// Define the context type
interface ServiceFollowUpRuleContextType {
  followUpRules: ServiceFollowUpRule[];
  isLoading: boolean;
  fetchFollowUpRules: () => Promise<void>;
  addFollowUpRule: (rule: Omit<ServiceFollowUpRule, 'id' | 'rule_id' | 'created_at' | 'updated_at'>) => Promise<ServiceFollowUpRule>;
  updateFollowUpRule: (id: string, updates: Partial<ServiceFollowUpRule>) => Promise<ServiceFollowUpRule>;
  deleteFollowUpRule: (id: string) => Promise<void>;
  getFollowUpRuleByServiceName: (serviceName: string) => ServiceFollowUpRule | undefined;
}

// Create the context
const ServiceFollowUpRuleContext = createContext<ServiceFollowUpRuleContextType | undefined>(undefined);

// Create the provider component
export const ServiceFollowUpRuleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { supabase } = useSupabase();
  const { dentalServices } = useServices();

  const [followUpRules, setFollowUpRules] = useState<ServiceFollowUpRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Define fetchFollowUpRules outside useEffect so it can be called from other functions
  const fetchFollowUpRules = async () => {
    try {
      console.log('Starting to fetch follow-up rules...');
      setIsLoading(true);

      // Fetch rules from Supabase using REST API
      const rulesResponse = await fetch(`${SUPABASE_URL}/rest/v1/service_follow_up_rules?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (!rulesResponse.ok) {
        const errorText = await rulesResponse.text();
        console.error('Error fetching rules:', errorText);
        throw new Error(`Failed to fetch rules: ${rulesResponse.status} ${rulesResponse.statusText}`);
      }

      const rulesData = await rulesResponse.json();

      console.log('Fetched rules from Supabase:', rulesData);

      // Fetch steps for each rule
      const rules: ServiceFollowUpRule[] = [];
      for (const rule of rulesData || []) {
        console.log(`Fetching steps for rule ${rule.id} (${rule.triggering_service_name})...`);

        // Fetch steps for each rule using REST API
        const stepsResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/follow_up_steps?service_follow_up_rule_id=eq.${rule.id}&select=*&order=sequence.asc`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );

        if (!stepsResponse.ok) {
          const errorText = await stepsResponse.text();
          console.error(`Error fetching steps for rule ${rule.id}:`, errorText);
          throw new Error(`Failed to fetch steps: ${stepsResponse.status} ${stepsResponse.statusText}`);
        }

        const stepsData = await stepsResponse.json();

        console.log(`Fetched steps for rule ${rule.id}:`, stepsData);

        // Check if any steps have missing suggested_service_name
        if (stepsData) {
          console.log('Raw steps data from database:', JSON.stringify(stepsData, null, 2));

          for (const step of stepsData) {
            console.log(`Step ${step.id} (sequence ${step.sequence}) full data:`, step);

            if (!step.suggested_service_name) {
              console.warn(`Step ${step.id} (sequence ${step.sequence}) has no suggested_service_name!`);

              // Try to fix the missing suggested_service_name
              if (step.suggestedServiceName) {
                console.log(`Found suggestedServiceName instead: "${step.suggestedServiceName}"`);
                step.suggested_service_name = step.suggestedServiceName;
              } else {
                console.log(`Setting default suggested_service_name for step ${step.id}`);
                step.suggested_service_name = `Follow-up ${step.sequence}`;
              }
            } else {
              console.log(`Step ${step.id} (sequence ${step.sequence}) has suggested_service_name: "${step.suggested_service_name}"`);
            }
          }
        }

        // Process steps to ensure all fields are correctly set
        const processedSteps = (stepsData || []).map(step => {
          // Make sure suggested_service_name is set
          if (!step.suggested_service_name && step.suggestedServiceName) {
            console.log(`Setting suggested_service_name from suggestedServiceName: ${step.suggestedServiceName}`);
            step.suggested_service_name = step.suggestedServiceName;
          }

          // If still not set, use a default
          if (!step.suggested_service_name) {
            console.log(`Setting default suggested_service_name for step ${step.sequence}`);
            step.suggested_service_name = `Follow-up ${step.sequence}`;
          }

          return step;
        });

        const completeRule = {
          id: rule.id,
          rule_id: rule.rule_id,
          service_id: rule.service_id,
          triggering_service_name: rule.triggering_service_name,
          followUps: processedSteps,
          created_at: rule.created_at,
          updated_at: rule.updated_at
        };

        console.log('Created complete rule object:', completeRule);
        rules.push(completeRule);
      }

      console.log('All rules with steps:', rules);
      setFollowUpRules(rules);
      console.log('Updated follow-up rules state with fetched data');
    } catch (error) {
      console.error('Error fetching follow-up rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load follow-up rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('Finished loading follow-up rules');
    }
  };

  // Fetch follow-up rules from Supabase on component mount
  useEffect(() => {
    fetchFollowUpRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, toast]);

  // Add a new follow-up rule
  const addFollowUpRule = async (rule: Omit<ServiceFollowUpRule, 'id' | 'rule_id' | 'created_at' | 'updated_at'>): Promise<ServiceFollowUpRule> => {
    // Track the created rule ID for cleanup if needed
    let createdRuleId = null;

    try {
      console.log('Adding follow-up rule:', rule);

      // Find service ID from name
      const service = dentalServices.find(s => s.name === rule.triggering_service_name);
      if (!service) {
        console.error(`Service "${rule.triggering_service_name}" not found in dentalServices:`, dentalServices);
        throw new Error(`Service "${rule.triggering_service_name}" not found`);
      }

      // Create rule ID
      const ruleId = `rule-${Date.now()}`;
      console.log('Created rule ID:', ruleId);

      // Prepare the rule data
      const ruleDataToInsert = {
        rule_id: ruleId,
        service_id: service.id,
        triggering_service_name: rule.triggering_service_name
      };
      console.log('Inserting rule data:', ruleDataToInsert);

      // Add rule to Supabase using a different approach
      // Use the REST API directly
      const response = await fetch(`${SUPABASE_URL}/rest/v1/service_follow_up_rules`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(ruleDataToInsert)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error inserting rule:', errorText);
        throw new Error(`Failed to insert rule: ${response.status} ${response.statusText}`);
      }

      const ruleData = await response.json();
      console.log('Rule inserted successfully using direct REST API:', ruleData);

      // Log the rule ID specifically to make sure it's available
      console.log('Rule ID from response:', ruleData.id);

      // If we don't get an ID back, fetch the rule by rule_id
      if (!ruleData.id) {
        console.error('No rule ID in response! Full response:', JSON.stringify(ruleData));
        console.log('Fetching rule by rule_id:', ruleId);

        try {
          const fetchResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/service_follow_up_rules?rule_id=eq.${ruleId}&select=*`,
            {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              }
            }
          );

          const fetchedRules = await fetchResponse.json();
          console.log('Fetched rules by rule_id:', fetchedRules);

          if (fetchedRules && fetchedRules.length > 0) {
            Object.assign(ruleData, fetchedRules[0]);
            console.log('Updated rule data with fetched rule:', ruleData);
          } else {
            console.error('Could not fetch rule by rule_id');
          }
        } catch (fetchError) {
          console.error('Error fetching rule by rule_id:', fetchError);
        }
      }



      if (!ruleData) {
        console.error('No data returned from rule insert');
        throw new Error('Failed to create follow-up rule');
      }

      console.log('Rule inserted successfully:', ruleData);

      // Before inserting steps, double-check that we have a valid rule ID
      if (!ruleData.id) {
        console.error('No rule ID available, cannot insert steps');
        throw new Error('Failed to get rule ID, cannot insert steps');
      }

      // Set the created rule ID for potential cleanup
      createdRuleId = ruleData.id;

      console.log('Using rule ID for steps:', ruleData.id);

      // Add steps to Supabase
      const steps: FollowUpStep[] = [];
      for (const step of rule.followUps) {
        console.log('Adding step:', step);

        // Prepare the step data
        // Ensure suggested_service_name is set
        if (!step.suggested_service_name) {
          console.warn(`Step ${step.sequence} has no suggested_service_name, setting default`);
          step.suggested_service_name = `Follow-up ${step.sequence}`;
        }

        console.log(`Preparing to insert step ${step.sequence} with suggested_service_name: "${step.suggested_service_name}"`);

        // Make sure suggested_service_name is set and not undefined
        let suggestedServiceName = step.suggested_service_name;

        // If it's undefined or null, try to use a default
        if (!suggestedServiceName) {
          console.warn(`Step ${step.sequence} has no suggested_service_name, setting default`);
          suggestedServiceName = `Follow-up ${step.sequence}`;
        }

        console.log(`Final suggested_service_name for step ${step.sequence}: "${suggestedServiceName}"`);

        const stepDataToInsert = {
          service_follow_up_rule_id: ruleData.id,
          follow_up_service_id: null, // No longer linking to a service
          sequence: step.sequence,
          interval_days: step.interval_days,
          suggested_service_name: suggestedServiceName, // Using the validated value
          notes: step.notes || ''
        };

        console.log('Step data to insert:', stepDataToInsert);
        console.log('Inserting step data:', stepDataToInsert);

        // Try a different approach - use the Supabase client directly
        console.log('Using Supabase client directly to insert step');

        try {
          // First, try with the Supabase client
          const { data: insertedStep, error: insertError } = await supabase
            .from('follow_up_steps')
            .insert([
              {
                service_follow_up_rule_id: ruleData.id,
                sequence: step.sequence,
                interval_days: step.interval_days,
                suggested_service_name: suggestedServiceName, // Use the validated value
                notes: step.notes || ''
              }
            ])
            .select();

          if (insertError) {
            console.error('Error inserting step with Supabase client:', insertError);

            // Fall back to direct REST API
            console.log('Falling back to direct REST API');
            const stepResponse = await fetch(`${SUPABASE_URL}/rest/v1/follow_up_steps`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(stepDataToInsert)
            });

            if (!stepResponse.ok) {
              const errorText = await stepResponse.text();
              console.error('Error inserting step with REST API:', errorText);
              throw new Error(`Failed to insert step: ${stepResponse.status} ${stepResponse.statusText}`);
            }

            const stepData = await stepResponse.json();
            console.log('Step inserted successfully using direct REST API:', stepData);

            // Add the step to the steps array
            steps.push({
              ...step,
              id: stepData.id,
              service_follow_up_rule_id: ruleData.id
            });
          } else {
            console.log('Step inserted successfully with Supabase client:', insertedStep);

            // Add the step to the steps array
            if (insertedStep && insertedStep.length > 0) {
              steps.push({
                ...step,
                id: insertedStep[0].id,
                service_follow_up_rule_id: ruleData.id
              });
            }
          }
        } catch (error) {
          console.error('Error in step insertion:', error);
          throw error;
        }

        // The step has already been added to the steps array in the try/catch block
      }

      // Process steps to ensure all fields are correctly set
      const processedSteps = steps.map(step => {
        // Make sure suggested_service_name is set
        if (!step.suggested_service_name && step.suggestedServiceName) {
          console.log(`Setting suggested_service_name from suggestedServiceName: ${step.suggestedServiceName}`);
          step.suggested_service_name = step.suggestedServiceName;
        }

        // If still not set, use a default
        if (!step.suggested_service_name) {
          console.log(`Setting default suggested_service_name for step ${step.sequence}`);
          step.suggested_service_name = `Follow-up ${step.sequence}`;
        }

        return step;
      });

      // Create the complete rule object
      const newRule: ServiceFollowUpRule = {
        id: ruleData.id,
        rule_id: ruleData.rule_id,
        service_id: ruleData.service_id,
        triggering_service_name: ruleData.triggering_service_name,
        followUps: processedSteps,
        created_at: ruleData.created_at,
        updated_at: ruleData.updated_at
      };

      console.log('Created complete rule object:', newRule);

      // Update local state
      setFollowUpRules(prev => {
        const updatedRules = [...prev, newRule];
        console.log('Updated follow-up rules state:', updatedRules);
        return updatedRules;
      });

      toast({
        title: 'Success',
        description: `Follow-up rule for ${rule.triggering_service_name} has been added.`,
      });

      // Fetch all rules to ensure UI is in sync with database
      await fetchFollowUpRules();

      return newRule;
    } catch (error) {
      console.error('Error adding follow-up rule:', error);

      // If we created a rule but failed to add steps, delete the rule
      if (createdRuleId) {
        console.log('Error occurred after rule creation, cleaning up rule:', createdRuleId);
        try {
          const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/service_follow_up_rules?id=eq.${createdRuleId}`, {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });

          if (deleteResponse.ok) {
            console.log('Cleanup successful');
          } else {
            console.error('Failed to clean up rule, status:', deleteResponse.status);
          }
        } catch (cleanupError) {
          console.error('Failed to clean up rule:', cleanupError);
        }
      }

      toast({
        title: 'Error',
        description: 'Failed to add follow-up rule. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a follow-up rule
  const updateFollowUpRule = async (id: string, updates: Partial<ServiceFollowUpRule>): Promise<ServiceFollowUpRule> => {
    try {
      console.log(`Updating follow-up rule with ID: ${id}`, updates);

      // Get the current rule
      const currentRule = followUpRules.find(r => r.id === id);
      if (!currentRule) {
        console.error(`Follow-up rule with ID ${id} not found in local state`);
        throw new Error('Follow-up rule not found');
      }

      console.log('Current rule:', currentRule);

      // Find service ID from name if name is being updated
      let serviceId = currentRule.service_id;
      if (updates.triggering_service_name && updates.triggering_service_name !== currentRule.triggering_service_name) {
        console.log(`Looking for service with name: ${updates.triggering_service_name}`);
        const service = dentalServices.find(s => s.name === updates.triggering_service_name);
        if (service) {
          serviceId = service.id;
          console.log(`Found service with ID: ${serviceId}`);
        } else {
          console.warn(`Service with name ${updates.triggering_service_name} not found in dentalServices`);
        }
      }

      const ruleUpdateData = {
        service_id: serviceId,
        triggering_service_name: updates.triggering_service_name || currentRule.triggering_service_name
      };
      console.log('Updating rule with data:', ruleUpdateData);

      // Update rule in Supabase using REST API
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/service_follow_up_rules?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(ruleUpdateData)
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error(`Error updating rule with ID ${id}:`, errorText);
        throw new Error(`Failed to update rule: ${updateResponse.status} ${updateResponse.statusText}`);
      }

      // Fetch the updated rule
      const fetchResponse = await fetch(`${SUPABASE_URL}/rest/v1/service_follow_up_rules?id=eq.${id}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error(`Error fetching updated rule with ID ${id}:`, errorText);
        throw new Error(`Failed to fetch updated rule: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }

      const fetchedRules = await fetchResponse.json();
      if (!fetchedRules || fetchedRules.length === 0) {
        console.error(`No rule found with ID ${id}`);
        throw new Error(`No rule found with ID ${id}`);
      }

      const ruleData = fetchedRules[0];



      if (!ruleData) {
        console.error('No data returned from rule update');
        throw new Error('Failed to update follow-up rule');
      }

      console.log('Rule updated successfully:', ruleData);

      // Handle follow-up steps updates if provided
      let updatedSteps = currentRule.followUps;
      if (updates.followUps) {
        console.log('Updating follow-up steps...');

        // Delete existing steps using REST API
        console.log(`Deleting existing steps for rule with ID: ${id}`);
        const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/follow_up_steps?service_follow_up_rule_id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error(`Error deleting steps for rule with ID ${id}:`, errorText);
          throw new Error(`Failed to delete steps: ${deleteResponse.status} ${deleteResponse.statusText}`);
        }

        console.log('Existing steps deleted successfully');

        // Add new steps
        updatedSteps = [];
        for (const step of updates.followUps) {
          console.log('Adding step:', step);

          // Ensure suggested_service_name is set
          if (!step.suggested_service_name) {
            console.warn(`Step ${step.sequence} has no suggested_service_name, setting default`);
            step.suggested_service_name = `Follow-up ${step.sequence}`;
          }

          console.log(`Preparing to insert step ${step.sequence} with suggested_service_name: "${step.suggested_service_name}"`);

          // Make sure suggested_service_name is set and not undefined
          let suggestedServiceName = step.suggested_service_name;

          // If it's undefined or null, try to use a default
          if (!suggestedServiceName) {
            console.warn(`Step ${step.sequence} has no suggested_service_name, setting default`);
            suggestedServiceName = `Follow-up ${step.sequence}`;
          }

          console.log(`Final suggested_service_name for step ${step.sequence}: "${suggestedServiceName}"`);

          const stepInsertData = {
            service_follow_up_rule_id: id,
            follow_up_service_id: null, // No longer linking to a service
            sequence: step.sequence,
            interval_days: step.interval_days,
            suggested_service_name: suggestedServiceName, // Using the validated value
            notes: step.notes || ''
          };

          console.log('Step data to insert:', stepInsertData);
          console.log('Inserting step data:', stepInsertData);

          // Use the REST API directly for consistency
          const stepResponse = await fetch(`${SUPABASE_URL}/rest/v1/follow_up_steps`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(stepInsertData)
          });

          if (!stepResponse.ok) {
            const errorText = await stepResponse.text();
            console.error('Error inserting step:', errorText);
            throw new Error(`Failed to insert step: ${stepResponse.status} ${stepResponse.statusText}`);
          }

          const stepData = await stepResponse.json();
          console.log('Step inserted successfully using direct REST API:', stepData);

          // Log the step data and the relationship
          console.log('Step service_follow_up_rule_id:', stepInsertData.service_follow_up_rule_id);
          console.log('Step data from response:', stepData);

          // Check if the step has the correct service_follow_up_rule_id
          if (stepData.service_follow_up_rule_id !== stepInsertData.service_follow_up_rule_id) {
            console.error('Step service_follow_up_rule_id mismatch!');
            console.error('Expected:', stepInsertData.service_follow_up_rule_id);
            console.error('Actual:', stepData.service_follow_up_rule_id);
          }



          if (stepData) {
            console.log('Step inserted successfully:', stepData);
            updatedSteps.push(stepData);
          } else {
            console.warn('No data returned from step insert');
          }
        }

        console.log('All steps updated successfully:', updatedSteps);
      }

      // Process steps to ensure all fields are correctly set
      const processedSteps = updatedSteps.map(step => {
        // Make sure suggested_service_name is set
        if (!step.suggested_service_name && step.suggestedServiceName) {
          console.log(`Setting suggested_service_name from suggestedServiceName: ${step.suggestedServiceName}`);
          step.suggested_service_name = step.suggestedServiceName;
        }

        // If still not set, use a default
        if (!step.suggested_service_name) {
          console.log(`Setting default suggested_service_name for step ${step.sequence}`);
          step.suggested_service_name = `Follow-up ${step.sequence}`;
        }

        return step;
      });

      // Create the updated rule object
      const updatedRule: ServiceFollowUpRule = {
        ...currentRule,
        service_id: ruleData.service_id,
        triggering_service_name: ruleData.triggering_service_name,
        followUps: processedSteps,
        updated_at: ruleData.updated_at
      };

      console.log('Created updated rule object:', updatedRule);

      // Update local state
      setFollowUpRules(prev => {
        const updatedRules = prev.map(r => r.id === id ? updatedRule : r);
        console.log('Updated follow-up rules state:', updatedRules);
        return updatedRules;
      });

      toast({
        title: 'Success',
        description: 'Follow-up rule has been updated.',
      });

      // Fetch all rules to ensure UI is in sync with database
      await fetchFollowUpRules();

      return updatedRule;
    } catch (error) {
      console.error('Error updating follow-up rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow-up rule. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a follow-up rule
  const deleteFollowUpRule = async (id: string): Promise<void> => {
    try {
      console.log(`Attempting to delete follow-up rule with ID: ${id}`);

      // Delete rule from Supabase using REST API (cascade will delete steps)
      const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/service_follow_up_rules?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error(`Error deleting follow-up rule with ID ${id}:`, errorText);
        throw new Error(`Failed to delete rule: ${deleteResponse.status} ${deleteResponse.statusText}`);
      }

      console.log(`Successfully deleted follow-up rule with ID: ${id} from Supabase`);

      // Update local state
      setFollowUpRules(prev => {
        const updatedRules = prev.filter(r => r.id !== id);
        console.log(`Removed rule with ID ${id} from local state. New state:`, updatedRules);
        return updatedRules;
      });

      toast({
        title: 'Success',
        description: 'Follow-up rule has been deleted.',
      });

      // Fetch all rules to ensure UI is in sync with database
      await fetchFollowUpRules();
    } catch (error) {
      console.error('Error deleting follow-up rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete follow-up rule. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get a follow-up rule by service name
  const getFollowUpRuleByServiceName = (serviceName: string): ServiceFollowUpRule | undefined => {
    return followUpRules.find(rule => rule.triggering_service_name === serviceName);
  };

  return (
    <ServiceFollowUpRuleContext.Provider
      value={{
        followUpRules,
        isLoading,
        fetchFollowUpRules,
        addFollowUpRule,
        updateFollowUpRule,
        deleteFollowUpRule,
        getFollowUpRuleByServiceName
      }}
    >
      {children}
    </ServiceFollowUpRuleContext.Provider>
  );
};

// Create a hook to use the context
export const useServiceFollowUpRules = () => {
  const context = useContext(ServiceFollowUpRuleContext);
  if (context === undefined) {
    throw new Error('useServiceFollowUpRules must be used within a ServiceFollowUpRuleProvider');
  }
  return context;
};
