/**
 * Example backend proxy for WhatsApp API
 * This should be implemented as a separate backend service
 * 
 * Usage: node scripts/whatsapp-proxy-example.js
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2

const app = express();
const PORT = 3001;

// Enable CORS for your frontend
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080']
}));

app.use(express.json());

const WHATSAPP_CONFIG = {
  endpoint: 'https://cloudapi.wbbox.in/api/v1.0/messages/send-template/917410516011',
  apiKey: '65eZYdphhEKPYmhvvp6EcA',
  templateName: 'appoinmemt_confirmed'
};

// Format phone number
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

app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { 
      phone,
      patientName,
      appointmentDate,
      appointmentTime,
      doctorName,
      serviceType,
      clinicName
    } = req.body;

    console.log('📱 Received WhatsApp request:', req.body);

    const formattedPhone = formatPhoneNumber(phone);
    
    const messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: {
        name: WHATSAPP_CONFIG.templateName,
        language: {
          code: "en"
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName },
              { type: "text", text: appointmentDate },
              { type: "text", text: appointmentTime },
              { type: "text", text: doctorName },
              { type: "text", text: serviceType },
              { type: "text", text: clinicName }
            ]
          }
        ]
      }
    };

    console.log('📤 Sending to WhatsApp API:', JSON.stringify(messageBody, null, 2));

    const response = await fetch(WHATSAPP_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHATSAPP_CONFIG.apiKey}`,
        'ApiKey': WHATSAPP_CONFIG.apiKey
      },
      body: JSON.stringify(messageBody)
    });

    const responseData = await response.json();
    console.log('📥 WhatsApp API response:', responseData);

    if (response.ok) {
      res.json({
        success: true,
        message: 'WhatsApp message sent successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: responseData.error || responseData.message || 'Failed to send WhatsApp message'
      });
    }
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp proxy server running on http://localhost:${PORT}`);
  console.log(`📱 Endpoint: POST http://localhost:${PORT}/api/whatsapp/send`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down WhatsApp proxy server...');
  process.exit(0);
});