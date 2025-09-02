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
  patientTemplateConfig: {
    templateName: 'appoinmemt_confirmed'
  },
  doctorTemplateConfig: {
    templateName: 'doctor_appointment_schedule'
  }
};

// Format phone number function
function formatPhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    return cleanPhone;
  }
  if (cleanPhone.length === 10) {
    return `91${cleanPhone}`;
  }
  if (cleanPhone.length > 10) {
    const last10Digits = cleanPhone.slice(-10);
    return `91${last10Digits}`;
  }
  return `91${cleanPhone}`;
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
    recipient
  } = req.body;

  console.log('📱 Received WhatsApp request for:', recipient === 'doctor' ? doctorName : patientName, phone);
  console.log('🔍 Recipient type:', recipient);
  console.log('📋 Request body keys:', Object.keys(req.body));
  console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));

  const formattedPhone = formatPhoneNumber(phone);
  
  // Get template config based on recipient
  const templateConfig = recipient === 'patient' 
    ? WHATSAPP_CONFIG.patientTemplateConfig 
    : WHATSAPP_CONFIG.doctorTemplateConfig;
    
  console.log('📨 Using template:', templateConfig.templateName, 'for recipient:', recipient);
  
  // Prepare template parameters based on recipient type
  let templateParameters;
  if (recipient === 'patient') {
    // Patient template: patientName, appointmentDate, appointmentTime, doctorName, serviceType, clinicName
    templateParameters = [
      { type: "text", text: patientName },
      { type: "text", text: appointmentDate },
      { type: "text", text: appointmentTime },
      { type: "text", text: doctorName },
      { type: "text", text: serviceType },
      { type: "text", text: clinicName }
    ];
  } else {
    // Doctor template: doctorName, patientName, appointmentDate, appointmentTime, serviceType, clinicName
    templateParameters = [
      { type: "text", text: doctorName },
      { type: "text", text: patientName },
      { type: "text", text: appointmentDate },
      { type: "text", text: appointmentTime },
      { type: "text", text: serviceType },
      { type: "text", text: clinicName }
    ];
  }
  
  const messageBody = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateConfig.templateName,
      language: { code: "en" },
      components: [{
        type: "body",
        parameters: templateParameters
      }]
    }
  };

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
      console.log('📥 WhatsApp API response:', data);
      
      if (whatsappRes.statusCode >= 200 && whatsappRes.statusCode < 300) {
        console.log('✅ WhatsApp message sent successfully');
        res.json({
          success: true,
          message: 'WhatsApp message sent successfully'
        });
      } else {
        console.error('❌ WhatsApp API error:', data);
        res.status(400).json({
          success: false,
          error: 'Failed to send WhatsApp message'
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