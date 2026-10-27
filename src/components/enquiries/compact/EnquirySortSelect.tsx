export type EnquirySortField = 'submitted_at' | 'name' | 'service_inquiry' | 'status';
export type EnquirySortDirection = 'asc' | 'desc';

// The sorts desktop offers through its Date, Name, Service and Status column headers
const OPTIONS: { value: string; label: string; field: EnquirySortField; direction: EnquirySortDirection }[] = [
  { value: 'submitted_at-desc', label: 'Date (Newest First)', field: 'submitted_at', direction: 'desc' },
  { value: 'submitted_at-asc', label: 'Date (Oldest First)', field: 'submitted_at', direction: 'asc' },
  { value: 'name-asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
  { value: 'name-desc', label: 'Name (Z-A)', field: 'name', direction: 'desc' },
  { value: 'service_inquiry-asc', label: 'Service (A-Z)', field: 'service_inquiry', direction: 'asc' },
  { value: 'service_inquiry-desc', label: 'Service (Z-A)', field: 'service_inquiry', direction: 'desc' },
  { value: 'status-asc', label: 'Status (A-Z)', field: 'status', direction: 'asc' },
  { value: 'status-desc', label: 'Status (Z-A)', field: 'status', direction: 'desc' },
];

interface EnquirySortSelectProps {
  sortField: EnquirySortField;
  sortDirection: EnquirySortDirection;
  onChange: (field: EnquirySortField, direction: EnquirySortDirection) => void;
}

// Phones/tablets show enquiries as cards, which have no column headers to tap, so sorting
// moves into this small drop-down with the same columns.
const EnquirySortSelect = ({ sortField, sortDirection, onChange }: EnquirySortSelectProps) => (
  <div className="flex items-center gap-2">
    <label htmlFor="enquiry-sort" className="text-sm font-medium whitespace-nowrap">Sort by</label>
    <select
      id="enquiry-sort"
      value={`${sortField}-${sortDirection}`}
      onChange={(e) => {
        const option = OPTIONS.find(o => o.value === e.target.value);
        if (option) onChange(option.field, option.direction);
      }}
      className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
    >
      {OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

export default EnquirySortSelect;
