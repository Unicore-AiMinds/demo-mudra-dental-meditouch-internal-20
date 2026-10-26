// A website contact-form submission ("enquiry").
export interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  service_inquiry: string;
  message: string | null;
  clinic: 'dental_metrix' | 'meditouch';
  status: 'new' | 'contacted' | 'follow-up' | 'scheduled' | 'closed';
  submitted_at: string;
  updated_at: string;
}

export const STATUS_OPTIONS: Enquiry['status'][] = [
  'new',
  'contacted',
  'follow-up',
  'scheduled',
  'closed',
];

export const STATUS_STYLES: Record<Enquiry['status'], string> = {
  new: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  contacted: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  'follow-up': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  scheduled: 'bg-green-100 text-green-800 hover:bg-green-100',
  closed: 'bg-gray-200 text-gray-700 hover:bg-gray-200',
};

export const STATUS_LABEL: Record<Enquiry['status'], string> = {
  new: 'New',
  contacted: 'Contacted',
  'follow-up': 'Follow-up',
  scheduled: 'Scheduled',
  closed: 'Closed',
};
