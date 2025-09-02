/**
 * WhatsApp API Service for sending appointment confirmation messages
 */

interface WhatsAppTemplateParams {
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  serviceType: string;
  clinicName: string;
  oldDate?: string;
  oldTime?: string;
}

interface WhatsAppAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const WHATSAPP_CONFIG = {
  endpoint: 'https://cloudapi.wbbox.in/api/v1.0/messages/send-template/917410516011',
  apiKey: '65eZYdphhEKPYmhvvp6EcA',
  patientTemplateConfig: {
    templateName: 'appoinmemt_confirmed'
  },
  doctorTemplateConfig: {
    templateName: 'doctor_appointment_schedule'
  },
  doctorRescheduleTemplateConfig: {
    templateName: 'doctor_appointment_rescheduled'
  },
  doctorCancellationTemplateConfig: {
    templateName: 'doctor_appointment_cancelled'
  }
};

/**
 * Format phone number to include country code
 * @param phone - Phone number string
 * @returns Formatted phone number with country code
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // If phone already starts with +, remove it and keep digits
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  // If phone already has a country code (11+ digits), return as is
  if (cleanPhone.length >= 11) {
    return cleanPhone;
  }
  
  // If it's exactly 10 digits, assume it's a local number and add default country code (91 for India)
  // This can be made configurable in the future
  if (cleanPhone.length === 10) {
    return `91${cleanPhone}`;
  }
  
  // If it's less than 10 digits, it's probably incomplete - return as is with default country code
  if (cleanPhone.length > 0) {
    return `91${cleanPhone}`;
  }
  
  // Fallback: return the original cleaned phone
  return cleanPhone;
};

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns Boolean indicating if phone number is valid
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const formattedPhone = formatPhoneNumber(phone);
  // Should be at least 10 digits (some countries have shorter numbers)
  // and at most 15 digits (international standard)
  return /^\d{10,15}$/.test(formattedPhone);
};

/**
 * Send WhatsApp appointment confirmation message to patient
 * @param recipientPhone - Recipient's phone number
 * @param params - Template parameters
 * @returns Promise with API response
 */
export const sendAppointmentConfirmation = async (
  recipientPhone: string,
  params: WhatsAppTemplateParams
): Promise<WhatsAppAPIResponse> => {
  return sendWhatsAppTemplate(recipientPhone, params, 'patient');
};

/**
 * Send WhatsApp appointment notification to doctor
 * @param doctorPhone - Doctor's phone number
 * @param params - Template parameters
 * @returns Promise with API response
 */
export const sendDoctorNotification = async (
  doctorPhone: string,
  params: WhatsAppTemplateParams
): Promise<WhatsAppAPIResponse> => {
  return sendWhatsAppTemplate(doctorPhone, params, 'doctor');
};

/**
 * Send WhatsApp reschedule notification to patient
 * @param patientPhone - Patient's phone number
 * @param params - Template parameters with old and new date/time
 * @returns Promise with API response
 */
export const sendRescheduleNotification = async (
  patientPhone: string,
  params: WhatsAppTemplateParams
): Promise<WhatsAppAPIResponse> => {
  return sendWhatsAppTemplate(patientPhone, params, 'reschedule');
};

/**
 * Send WhatsApp reschedule notification to doctor
 * @param doctorPhone - Doctor's phone number
 * @param params - Template parameters with old and new date/time
 * @returns Promise with API response
 */
export const sendDoctorRescheduleNotification = async (
  doctorPhone: string,
  params: WhatsAppTemplateParams
): Promise<WhatsAppAPIResponse> => {
  return sendWhatsAppTemplate(doctorPhone, params, 'doctor_reschedule');
};

/**
 * Send WhatsApp cancellation notification to patient
 * @param patientPhone - Patient's phone number
 * @param params - Template parameters for cancellation
 * @returns Promise with API response
 */
export const sendCancellationNotification = async (
  patientPhone: string,
  params: WhatsAppTemplateParams
): Promise<WhatsAppAPIResponse> => {
  return sendWhatsAppTemplate(patientPhone, params, 'cancellation');
};

/**
 * Send WhatsApp cancellation notification to doctor
 * @param doctorPhone - Doctor's phone number
 * @param params - Template parameters for cancellation
 * @returns Promise with API response
 */
export const sendDoctorCancellationNotification = async (
  doctorPhone: string,
  params: WhatsAppTemplateParams
): Promise<WhatsAppAPIResponse> => {
  return sendWhatsAppTemplate(doctorPhone, params, 'doctor_cancellation');
};

/**
 * Generic function to send WhatsApp template messages
 * @param recipientPhone - Recipient's phone number
 * @param params - Template parameters
 * @param recipient - 'patient' or 'doctor'
 * @returns Promise with API response
 */
const sendWhatsAppTemplate = async (
  recipientPhone: string,
  params: WhatsAppTemplateParams,
  recipient: 'patient' | 'doctor' | 'reschedule' | 'cancellation' | 'doctor_reschedule' | 'doctor_cancellation'
): Promise<WhatsAppAPIResponse> => {
  try {
    console.log('🔵 WhatsApp API called with:', { recipientPhone, params, recipient });
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(recipientPhone);
    console.log('📱 Formatted phone number:', formattedPhone);
    
    // Validate phone number
    if (!isValidPhoneNumber(recipientPhone)) {
      console.error('❌ Invalid phone number format:', recipientPhone);
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // Check if we should use proxy (production) or direct API (with CORS fallback)
    const proxyUrl = import.meta.env.VITE_WHATSAPP_PROXY_URL;
    const isProd = import.meta.env.PROD;
    const isDev = import.meta.env.DEV;
    
    console.log('🔧 Environment check:', { proxyUrl, isProd, isDev });
    
    const useProxy = !!proxyUrl;
    
    if (useProxy) {
      // Use backend proxy for production
      const actualProxyUrl = proxyUrl || 'http://localhost:3001/api/whatsapp/send';
      console.log('🔄 Using WhatsApp proxy:', actualProxyUrl);
      
      const requestBody = {
        phone: formattedPhone,
        patientName: params.patientName,
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
        doctorName: params.doctorName,
        serviceType: params.serviceType,
        clinicName: params.clinicName,
        oldDate: params.oldDate,
        oldTime: params.oldTime,
        recipient: recipient
      };
      
      console.log('📤 Sending proxy request with recipient:', recipient);
      console.log('📤 Full proxy request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(actualProxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      
      if (response.ok && responseData.success) {
        console.log('✅ WhatsApp message sent via proxy');
        return {
          success: true,
          message: 'WhatsApp message sent successfully'
        };
      } else {
        console.error('❌ WhatsApp proxy error:', responseData);
        return {
          success: false,
          error: responseData.error || 'Failed to send WhatsApp message via proxy'
        };
      }
    } else {
      // Direct API call (development with CORS fallback)
      console.log('🔄 Using direct WhatsApp API (development mode)');
      
      // Get template config based on recipient
      let templateConfig: { templateName: string };
      if (recipient === 'patient') {
        templateConfig = WHATSAPP_CONFIG.patientTemplateConfig;
      } else if (recipient === 'doctor_reschedule') {
        templateConfig = WHATSAPP_CONFIG.doctorRescheduleTemplateConfig;
      } else if (recipient === 'doctor_cancellation') {
        templateConfig = WHATSAPP_CONFIG.doctorCancellationTemplateConfig;
      } else {
        templateConfig = WHATSAPP_CONFIG.doctorTemplateConfig;
      }
      
      // Prepare template parameters based on recipient type
      let templateParameters: Array<{ type: string; text: string }>;
      if (recipient === 'patient') {
        // Patient template: patientName, appointmentDate, appointmentTime, doctorName, serviceType, clinicName
        templateParameters = [
          { type: "text", text: params.patientName },
          { type: "text", text: params.appointmentDate },
          { type: "text", text: params.appointmentTime },
          { type: "text", text: params.doctorName },
          { type: "text", text: params.serviceType },
          { type: "text", text: params.clinicName }
        ];
      } else if (recipient === 'doctor_reschedule') {
        // Doctor reschedule template: doctorName, patientName, oldDate, oldTime, newDate, newTime, serviceType
        templateParameters = [
          { type: "text", text: params.doctorName },
          { type: "text", text: params.patientName },
          { type: "text", text: params.oldDate || '' },
          { type: "text", text: params.oldTime || '' },
          { type: "text", text: params.appointmentDate },
          { type: "text", text: params.appointmentTime },
          { type: "text", text: params.serviceType }
        ];
      } else if (recipient === 'doctor_cancellation') {
        // Doctor cancellation template: doctorName, patientName, appointmentDate, appointmentTime, serviceType, clinicName
        templateParameters = [
          { type: "text", text: params.doctorName },
          { type: "text", text: params.patientName },
          { type: "text", text: params.appointmentDate },
          { type: "text", text: params.appointmentTime },
          { type: "text", text: params.serviceType },
          { type: "text", text: params.clinicName }
        ];
      } else {
        // Doctor template: doctorName, patientName, appointmentDate, appointmentTime, serviceType, clinicName
        templateParameters = [
          { type: "text", text: params.doctorName },
          { type: "text", text: params.patientName },
          { type: "text", text: params.appointmentDate },
          { type: "text", text: params.appointmentTime },
          { type: "text", text: params.serviceType },
          { type: "text", text: params.clinicName }
        ];
      }
      
      // Prepare the message body
      const messageBody = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateConfig.templateName,
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: templateParameters
            }
          ]
        }
      };

      console.log('📤 Sending WhatsApp message:', JSON.stringify(messageBody, null, 2));

      // Send the message
      const response = await fetch(WHATSAPP_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_CONFIG.apiKey}`,
          'ApiKey': WHATSAPP_CONFIG.apiKey
        },
        body: JSON.stringify(messageBody)
      });

      console.log('📥 WhatsApp API response status:', response.status);
      const responseData = await response.json();
      console.log('📥 WhatsApp API response data:', responseData);

      if (response.ok) {
        console.log('✅ WhatsApp message sent successfully');
        return {
          success: true,
          message: 'WhatsApp message sent successfully'
        };
      } else {
        console.error('❌ WhatsApp API error:', responseData);
        return {
          success: false,
          error: responseData.error || responseData.message || 'Failed to send WhatsApp message'
        };
      }
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    
    // Check if it's a CORS error
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.warn('🌐 CORS error detected - this is expected in development');
      console.log('💡 In production, implement a backend proxy to avoid CORS issues');
      
      // For development, we'll simulate success to test the flow
      if (import.meta.env.DEV) {
        console.log('🔄 Development mode: Simulating WhatsApp success for testing');
        return {
          success: true,
          message: 'WhatsApp message simulated in development (CORS blocked actual send)'
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Check if patient has WhatsApp enabled and valid phone number
 * @param patient - Patient object
 * @returns Boolean indicating if WhatsApp notification can be sent
 */
export const canSendWhatsApp = (patient: { phone: string; has_whatsapp?: boolean }): boolean => {
  return !!(patient.has_whatsapp && patient.phone && isValidPhoneNumber(patient.phone));
};