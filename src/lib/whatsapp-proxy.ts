/**
 * WhatsApp Proxy Service - Alternative approach using a backend proxy
 * This can be implemented as a serverless function or backend endpoint
 */

interface WhatsAppProxyResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// This would be your backend endpoint that proxies the WhatsApp API
const PROXY_ENDPOINT = '/api/whatsapp/send'; // You'll need to implement this

export const sendWhatsAppViaProxy = async (
  recipientPhone: string,
  params: {
    patientName: string;
    appointmentDate: string;
    appointmentTime: string;
    doctorName: string;
    serviceType: string;
    clinicName: string;
  }
): Promise<WhatsAppProxyResponse> => {
  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: recipientPhone,
        ...params
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp via proxy:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};