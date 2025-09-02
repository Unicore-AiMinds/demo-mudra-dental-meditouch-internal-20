/**
 * Simple WhatsApp Proxy Server
 * Run this alongside your main application
 */

const express = require('express');
const https = require('https');
const app = express();
const PORT = 3001;

// Enable CORS for your frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// WhatsApp configuration
const WHATSAPP_CONFIG = {
  endpoint: 'https://cloudapi.wbbox.in/api/v1.0/messages/send-template/917410516011',
  apiKey: '65eZYdphhEKPYmhvvp6EcA',
  templates: {
    patient: 'appoinmemt_confirmed',
    doctor: 'doctor_appointment_schedule',
    reschedule: 'appointments_rescheduled',
    cancellation: 'appointment_cancelled',
    doctor_reschedule: 'doctor_appointment_rescheduled',
    doctor_cancellation: 'doctor_appointment_cancelled'
  }
};

// Format phone number function
function formatPhoneNumber(phone) {
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
}

// WhatsApp endpoint
app.post('/api/whatsapp/send', (req, res) => {
  const { 
    phone,
    patientName,
    appointmentDate,
    appointmentTime,
    doctorName,
    serviceType,
    clinicName,
    oldDate,
    oldTime,
    recipient
  } = req.body;

  console.log('📱 Received WhatsApp request for:', recipient === 'doctor' ? doctorName : patientName, phone);
  console.log('🔍 Recipient type:', recipient);
  console.log('📋 Request body keys:', Object.keys(req.body));
  console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));

  const formattedPhone = formatPhoneNumber(phone);
  
  // Get template name based on recipient
  const templateName = WHATSAPP_CONFIG.templates[recipient] || WHATSAPP_CONFIG.templates.patient;
    
  console.log('📨 Using template:', templateName, 'for recipient:', recipient);
  
  // Prepare template parameters based on recipient type
  let templateParameters;
  if (recipient === 'patient') {
    // Patient template: patientName, appointmentDate, appointmentTime, doctorName, serviceType, clinicName
    templateParameters = [
      { type: "text", text: patientName || 'Patient' },
      { type: "text", text: appointmentDate || 'Date' },
      { type: "text", text: appointmentTime || 'Time' },
      { type: "text", text: doctorName || 'Doctor' },
      { type: "text", text: serviceType || 'Service' },
      { type: "text", text: clinicName || 'Clinic' }
    ];
  } else if (recipient === 'doctor') {
    // Doctor template: doctorName, patientName, appointmentDate, appointmentTime, serviceType, clinicName
    templateParameters = [
      { type: "text", text: doctorName || 'Doctor' },
      { type: "text", text: patientName || 'Patient' },
      { type: "text", text: appointmentDate || 'Date' },
      { type: "text", text: appointmentTime || 'Time' },
      { type: "text", text: serviceType || 'Service' },
      { type: "text", text: clinicName || 'Clinic' }
    ];
  } else if (recipient === 'reschedule') {
    // Reschedule template: patientName, oldDate, oldTime, newDate, newTime, doctorName, serviceType
    templateParameters = [
      { type: "text", text: patientName || 'Patient' },
      { type: "text", text: oldDate || 'Old Date' },
      { type: "text", text: oldTime || 'Old Time' },
      { type: "text", text: appointmentDate || 'New Date' },
      { type: "text", text: appointmentTime || 'New Time' },
      { type: "text", text: doctorName || 'Doctor' },
      { type: "text", text: serviceType || 'Service' }
    ];
  } else if (recipient === 'cancellation') {
    // Cancellation template: patientName, appointmentDate, appointmentTime, doctorName
    templateParameters = [
      { type: "text", text: patientName || 'Patient' },
      { type: "text", text: appointmentDate || 'Date' },
      { type: "text", text: appointmentTime || 'Time' },
      { type: "text", text: doctorName || 'Doctor' }
    ];
  } else if (recipient === 'doctor_reschedule') {
    // Doctor reschedule template: doctorName, patientName, oldDate, oldTime, newDate, newTime, serviceType
    templateParameters = [
      { type: "text", text: doctorName || 'Doctor' },
      { type: "text", text: patientName || 'Patient' },
      { type: "text", text: oldDate || 'Old Date' },
      { type: "text", text: oldTime || 'Old Time' },
      { type: "text", text: appointmentDate || 'New Date' },
      { type: "text", text: appointmentTime || 'New Time' },
      { type: "text", text: serviceType || 'Service' }
    ];
  } else if (recipient === 'doctor_cancellation') {
    // Doctor cancellation template: doctorName, patientName, appointmentDate, appointmentTime, serviceType, clinicName
    templateParameters = [
      { type: "text", text: doctorName || 'Doctor' },
      { type: "text", text: patientName || 'Patient' },
      { type: "text", text: appointmentDate || 'Date' },
      { type: "text", text: appointmentTime || 'Time' },
      { type: "text", text: serviceType || 'Service' },
      { type: "text", text: clinicName || 'Clinic' }
    ];
  }
  
  const messageBody = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en" },
      components: [{
        type: "body",
        parameters: templateParameters
      }]
    }
  };

  console.log('🔍 Template parameters:', templateParameters);
  console.log('🔍 Complete message body:', JSON.stringify(messageBody, null, 2));
  
  const postData = JSON.stringify(messageBody);
  
  const options = {
    hostname: 'cloudapi.wbbox.in',
    port: 443,
    path: '/api/v1.0/messages/send-template/917410516011',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WHATSAPP_CONFIG.apiKey}`,
      'ApiKey': WHATSAPP_CONFIG.apiKey,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const whatsappReq = https.request(options, (whatsappRes) => {
    let data = '';
    
    whatsappRes.on('data', (chunk) => {
      data += chunk;
    });
    
    whatsappRes.on('end', () => {
      console.log('📥 WhatsApp API response status:', whatsappRes.statusCode);
      console.log('📥 WhatsApp API response data:', data);
      
      try {
        const responseData = JSON.parse(data);
        console.log('📥 Parsed response:', JSON.stringify(responseData, null, 2));
      } catch (e) {
        console.log('📥 Could not parse response as JSON');
      }
      
      if (whatsappRes.statusCode >= 200 && whatsappRes.statusCode < 300) {
        console.log('✅ WhatsApp message sent successfully');
        res.json({
          success: true,
          message: 'WhatsApp message sent successfully'
        });
      } else {
        console.error('❌ WhatsApp API error - Status:', whatsappRes.statusCode);
        console.error('❌ WhatsApp API error - Data:', data);
        res.status(400).json({
          success: false,
          error: 'Failed to send WhatsApp message',
          details: data
        });
      }
    });
  });

  whatsappReq.on('error', (error) => {
    console.error('❌ Request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  });

  whatsappReq.write(postData);
  whatsappReq.end();
});

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp proxy server running on http://localhost:${PORT}`);
  console.log(`📱 Endpoint: POST http://localhost:${PORT}/api/whatsapp/send`);
  console.log('');
  console.log('✅ Ready to send real WhatsApp messages!');
  console.log('💡 Add VITE_WHATSAPP_PROXY_URL=http://localhost:3001/api/whatsapp/send to your .env file');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down WhatsApp proxy server...');
  process.exit(0);
});