const OPENCLAW_BASE_URL = '';

export interface WhatsAppMessageResult {
  success: boolean;
  error?: string;
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

// Placeholders — message content will be updated per appointment event
export async function sendAppointmentScheduledMessage(phone: string, patientName: string, date: string, time: string, service: string, followUpService?: string): Promise<WhatsAppMessageResult> {
  let message = `Hello ${patientName}, your appointment for ${service} has been scheduled on ${date} at ${time}.`;
  if (followUpService) {
    message += ` This is a follow-up appointment for ${followUpService}.`;
  }
  return sendMessage(phone, message);
}

export async function sendAppointmentRescheduledMessage(phone: string, patientName: string, date: string, time: string, service: string): Promise<WhatsAppMessageResult> {
  const message = `Hello ${patientName}, your appointment for ${service} has been rescheduled to ${date} at ${time}.`;
  return sendMessage(phone, message);
}

export async function sendAppointmentCompletedMessage(phone: string, patientName: string, date: string, service: string): Promise<WhatsAppMessageResult> {
  const message = `Hello ${patientName}, your appointment for ${service} on ${date} has been completed. Thank you for visiting!`;
  return sendMessage(phone, message);
}

export async function sendAppointmentCancelledMessage(phone: string, patientName: string, date: string, service: string): Promise<WhatsAppMessageResult> {
  const message = `Hello ${patientName}, your appointment for ${service} on ${date} has been cancelled.`;
  return sendMessage(phone, message);
}
