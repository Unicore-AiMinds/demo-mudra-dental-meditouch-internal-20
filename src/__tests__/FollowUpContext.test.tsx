import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { FollowUpProvider, useFollowUps } from '@/contexts/FollowUpContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { format, addDays } from 'date-fns';

// Mock the Supabase context
jest.mock('@/contexts/SupabaseContext', () => ({
  useSupabase: jest.fn(),
}));

// Mock the toast component
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Test component that uses the FollowUp context
const TestComponent = () => {
  const { 
    followUps, 
    isLoading, 
    getPendingFollowUps, 
    getSnoozedFollowUps 
  } = useFollowUps();

  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="follow-ups-count">{followUps.length}</div>
      <div data-testid="pending-count">{getPendingFollowUps().length}</div>
      <div data-testid="snoozed-count">{getSnoozedFollowUps().length}</div>
      <ul>
        {followUps.map(followUp => (
          <li key={followUp.id} data-testid={`follow-up-${followUp.id}`}>
            {followUp.patient_name} - {followUp.suggested_service_name}
          </li>
        ))}
      </ul>
    </div>
  );
};

describe('FollowUpContext', () => {
  const mockSupabaseSelect = jest.fn();
  const mockSupabaseInsert = jest.fn();
  const mockSupabaseUpdate = jest.fn();
  const mockSupabaseDelete = jest.fn();
  
  // Mock follow-up data
  const mockFollowUps = [
    {
      id: '1',
      follow_up_id: 'FU001',
      patient_id: 'P001',
      patient_name: 'John Doe',
      tentative_date: format(new Date(), 'yyyy-MM-dd'),
      follow_up_sequence: 1,
      total_steps_in_sequence: 1,
      suggested_service_name: 'Checkup',
      original_service: 'Cleaning',
      original_doctor: 'Dr. Smith',
      status: 'Pending',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      follow_up_id: 'FU002',
      patient_id: 'P002',
      patient_name: 'Jane Smith',
      tentative_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      follow_up_sequence: 1,
      total_steps_in_sequence: 1,
      suggested_service_name: 'Root Canal',
      original_service: 'Filling',
      original_doctor: 'Dr. Johnson',
      status: 'Snoozed',
      snoozed_until: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup Supabase mock
    mockSupabaseSelect.mockReturnValue({
      order: jest.fn().mockReturnValue({
        data: mockFollowUps,
        error: null,
      }),
    });
    
    mockSupabaseInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockReturnValue({
          data: mockFollowUps[0],
          error: null,
        }),
      }),
    });
    
    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockReturnValue({
            data: { ...mockFollowUps[0], status: 'Completed' },
            error: null,
          }),
        }),
      }),
    });
    
    mockSupabaseDelete.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        data: null,
        error: null,
      }),
    });
    
    // Setup useSupabase mock
    (useSupabase as jest.Mock).mockReturnValue({
      supabase: {
        from: jest.fn().mockImplementation((table) => {
          if (table === 'follow_ups') {
            return {
              select: mockSupabaseSelect,
              insert: mockSupabaseInsert,
              update: mockSupabaseUpdate,
              delete: mockSupabaseDelete,
            };
          }
          return {};
        }),
      },
    });
  });

  it('should fetch follow-ups on mount', async () => {
    render(
      <FollowUpProvider>
        <TestComponent />
      </FollowUpProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Check if follow-ups are displayed
    expect(screen.getByTestId('follow-ups-count').textContent).toBe('2');
    expect(screen.getByTestId('pending-count').textContent).toBe('1');
    expect(screen.getByTestId('snoozed-count').textContent).toBe('1');
    
    // Check if specific follow-ups are displayed
    expect(screen.getByTestId('follow-up-1').textContent).toContain('John Doe');
    expect(screen.getByTestId('follow-up-2').textContent).toContain('Jane Smith');
  });
});
