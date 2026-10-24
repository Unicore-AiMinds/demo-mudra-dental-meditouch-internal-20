import type { SortingState } from '@tanstack/react-table';

// Same as the Patients page's initial sorting (newest added first)
export const DEFAULT_PATIENT_SORTING: SortingState = [{ id: 'created_at', desc: true }];

// The columns desktop lets you sort by tapping their headers
const OPTIONS: { value: string; label: string; sorting: SortingState }[] = [
  { value: 'default', label: 'Default order', sorting: DEFAULT_PATIENT_SORTING },
  { value: 'name-asc', label: 'Name (A–Z)', sorting: [{ id: 'name', desc: false }] },
  { value: 'name-desc', label: 'Name (Z–A)', sorting: [{ id: 'name', desc: true }] },
  { value: 'age-asc', label: 'Age (low–high)', sorting: [{ id: 'age', desc: false }] },
  { value: 'age-desc', label: 'Age (high–low)', sorting: [{ id: 'age', desc: true }] },
  { value: 'lastVisit-asc', label: 'Last Visit (oldest first)', sorting: [{ id: 'lastVisit', desc: false }] },
  { value: 'lastVisit-desc', label: 'Last Visit (newest first)', sorting: [{ id: 'lastVisit', desc: true }] },
];

const valueFor = (sorting: SortingState) => {
  const s = sorting[0];
  if (!s || s.id === 'created_at') return 'default';
  return `${s.id}-${s.desc ? 'desc' : 'asc'}`;
};

interface PatientSortSelectProps {
  sorting: SortingState;
  onChange: (sorting: SortingState) => void;
}

// Phones/tablets show patients as cards, which have no column headers to tap, so sorting
// moves into this small drop-down with the same columns.
const PatientSortSelect = ({ sorting, onChange }: PatientSortSelectProps) => (
  <div className="flex items-center gap-2">
    <label htmlFor="patient-sort" className="text-sm font-medium whitespace-nowrap">Sort by</label>
    <select
      id="patient-sort"
      value={valueFor(sorting)}
      onChange={(e) => {
        const option = OPTIONS.find(o => o.value === e.target.value);
        if (option) onChange(option.sorting);
      }}
      className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
    >
      {OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

export default PatientSortSelect;
