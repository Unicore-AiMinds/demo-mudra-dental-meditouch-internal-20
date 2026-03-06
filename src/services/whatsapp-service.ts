const OPENCLAW_BASE_URL = '';

export interface WhatsAppMessageResult {
  success: boolean;
  error?: string;
}

/** Convert yyyy-MM-dd to "August 20th, 2025" */
function formatDate(date: string): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  const year = parts[0];
  const month = months[parseInt(parts[1], 10) - 1];
  const day = parseInt(parts[2], 10);
  if (!month) return date;
  const suffix = (day === 1 || day === 21 || day === 31) ? 'st'
    : (day === 2 || day === 22) ? 'nd'
    : (day === 3 || day === 23) ? 'rd' : 'th';
  return `${month} ${day}${suffix}, ${year}`;
}

/** Map clinic type to display name */
function formatClinicName(clinic: string): string {
  if (clinic === 'dental') return 'Dental Metrix';
  if (clinic === 'meditouch') return 'Meditouch';
  return clinic;
}

/** Normalize time to "3:15 PM" format */
function formatTime(time: string): string {
  const trimmed = time.trim().toUpperCase();
  // Already in readable format like "3:15 PM"
  if (/\d{1,2}:\d{2}\s*(AM|PM)/i.test(trimmed)) return time.trim();
  // Handle 24h format like "15:15"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  }
  return time.trim();
}

function normalizePhone(phone: string): string {
  const stripped = phone.replace(/[\s\-().+]/g, '');
  if (/^\d{10}$/.test(stripped)) return '+91' + stripped;
  return '+' + stripped;
}

async function sendMessage(phone: string, message: string): Promise<WhatsAppMessageResult> {
  const normalizedPhone = normalizePhone(phone);
  try {
    const response = await fetch(`${OPENCLAW_BASE_URL}/api/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone, message }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Server responded with ${response.status}: ${text}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendTestWhatsAppMessage(phone: string): Promise<WhatsAppMessageResult> {
  const message = `Hello! This is a test message from DentalMetrix. Your appointment system is connected successfully.`;
  return sendMessage(phone, message);
}

export async function sendAppointmentScheduledMessage(
  phone: string,
  patientName: string,
  date: string,
  time: string,
  service: string,
  doctor: string,
  clinic: string,
  followUpService?: string,
): Promise<WhatsAppMessageResult> {
  let message = `*Appointment Confirmed*\n\nHello ${patientName},\n\nYour appointment has been booked successfully:\n\n*Date:* ${formatDate(date)}\n*Time:* ${formatTime(time)}\n*Doctor:* ${doctor}\n*Service:* ${service}`;
  if (followUpService) {
    message += `\n*Follow-up Service:* ${followUpService}`;
  }
  message += `\n*Clinic:* ${formatClinicName(clinic)}\n\nPlease arrive 15 minutes early.\n\nThank you for connecting with us.`;
  return sendMessage(phone, message);
}

export async function sendAppointmentRescheduledMessage(
  phone: string,
  patientName: string,
  date: string,
  time: string,
  service: string,
  doctor: string,
  clinic: string,
  followUpService?: string,
): Promise<WhatsAppMessageResult> {
  let message = `*Appointment Rescheduled*\n\nHello ${patientName},\n\nYour appointment has been rescheduled successfully:\n\n*Date:* ${formatDate(date)}\n*Time:* ${formatTime(time)}\n*Doctor:* ${doctor}\n*Service:* ${service}`;
  if (followUpService) {
    message += `\n*Follow-up Service:* ${followUpService}`;
  }
  message += `\n*Clinic:* ${formatClinicName(clinic)}\n\nPlease arrive 15 minutes early.\n\nThank you for connecting with us.`;
  return sendMessage(phone, message);
}

export async function sendAppointmentCompletedMessage(phone: string, patientName: string, date: string, service: string): Promise<WhatsAppMessageResult> {
  const message = `Hello ${patientName}, your appointment for ${service} on ${date} has been completed. Thank you for visiting!`;
  return sendMessage(phone, message);
}

export async function sendAppointmentCancelledMessage(
  phone: string,
  patientName: string,
  date: string,
  time: string,
  doctor: string,
): Promise<WhatsAppMessageResult> {
  const message = `*Appointment Cancelled*\n\nHello ${patientName},\n\nYour appointment scheduled for ${formatDate(date)} at ${formatTime(time)} with ${doctor} has been cancelled.\n\nNeed to reschedule? Call us.\n\nWe're here to help!\n\nThank you for connecting with us.`;
  return sendMessage(phone, message);
}
