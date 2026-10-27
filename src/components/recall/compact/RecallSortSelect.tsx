export type RecallSortBy = 'date' | 'patient';
export type RecallSortOrder = 'asc' | 'desc';

// The sorts desktop offers through its "Patient" and "Tentative Date" column headers,
// in desktop's own wording
const OPTIONS: { value: string; label: string; sortBy: RecallSortBy; sortOrder: RecallSortOrder }[] = [
  { value: 'date-asc', label: 'Tentative Date (Earliest First)', sortBy: 'date', sortOrder: 'asc' },
  { value: 'date-desc', label: 'Tentative Date (Latest First)', sortBy: 'date', sortOrder: 'desc' },
  { value: 'patient-asc', label: 'Patient (A-Z)', sortBy: 'patient', sortOrder: 'asc' },
  { value: 'patient-desc', label: 'Patient (Z-A)', sortBy: 'patient', sortOrder: 'desc' },
];

interface RecallSortSelectProps {
  sortBy: RecallSortBy;
  sortOrder: RecallSortOrder;
  onChange: (sortBy: RecallSortBy, sortOrder: RecallSortOrder) => void;
}

// Phones/tablets show recalls as cards, which have no column headers to tap, so sorting
// moves into this small drop-down with the same choices.
const RecallSortSelect = ({ sortBy, sortOrder, onChange }: RecallSortSelectProps) => (
  <div className="flex items-center gap-2">
    <label htmlFor="recall-sort" className="text-sm font-medium whitespace-nowrap">Sort by</label>
    <select
      id="recall-sort"
      value={`${sortBy}-${sortOrder}`}
      onChange={(e) => {
        const option = OPTIONS.find(o => o.value === e.target.value);
        if (option) onChange(option.sortBy, option.sortOrder);
      }}
      className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
    >
      {OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

export default RecallSortSelect;
