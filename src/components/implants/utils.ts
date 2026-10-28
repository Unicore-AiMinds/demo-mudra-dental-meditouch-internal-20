// Small helpers shared by the Implant Tracker page and popups (POC)
import { format } from 'date-fns';
import { Implant } from '@/lib/implants';

export const todayISO = () => format(new Date(), 'yyyy-MM-dd');

export const implantName = (implant: Implant) => `${implant.item} (${implant.subItem})`;

export const formatDate = (date: string) => (date ? format(new Date(`${date}T00:00:00`), 'dd/MM/yyyy') : '');

export const formatExpiry = (date: string) => (date ? format(new Date(`${date}T00:00:00`), 'MM/yyyy') : '');

export interface MessageState {
  isOpen: boolean;
  title: string;
  message: string;
}

export const closedMessage: MessageState = { isOpen: false, title: '', message: '' };
