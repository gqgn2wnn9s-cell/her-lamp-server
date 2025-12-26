const mqtt = require('mqtt');
const twilio = require('twilio');
const express = require('express');
const bodyParser = require('body-parser');

// ---------- MQTT ----------
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

// ---------- TWILIO ----------
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
if (!accountSid || !authToken) {
  console.error("Twilio credentials missing!");
  process.exit(1);
}


const twilioClient = twilio(accountSid, authToken);

// Twilio WhatsApp sandbox number
const FROM = 'whatsapp:+14155238886';

// YOUR WhatsApp number (with country code)
const TO = 'whatsapp:+919810583998';

// ---------- EXPRESS SERVER ----------
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// ---------- MESSAGE MAP ----------
const whatsappToLamp = {
  'miss you': 'miss_you',
  'thinking of you': 'thinking_of_you',
  'call me': 'can_you_call',
  'good night': 'good_night',
  'good morning': 'good_morning'
};

const lampToWhatsapp = {
  miss_you: '❤️ She misses you',
  thinking_of_you: '💭 She is thinking of you',
  can_you_call: '📞 Can you call her?',
  good_morning: '🌅 She said good morning',
  good_night: '🌙 She said good night'
};

// ---------- MQTT LISTEN ----------
mqttClient.on('connect', () => {
  console.log('MQTT connected');
  mqttClient.subscribe('shaurya/her_lamp/command');
});

mqttClient.on('message', (_, payload) => {
  const cmd = payload.toString();
  if (lampToWhatsapp[cmd]) {
    twilioClient.messages.create({
      from: FROM,
      to: TO,
      body: lampToWhatsapp[cmd]
    });
  }
});

// ---------- WHATSAPP WEBHOOK ----------
app.post('/whatsapp', (req, res) => {
  const incoming = req.body.Body.toLowerCase().trim();
  console.log('WhatsApp received:', incoming);

  if (whatsappToLamp[incoming]) {
    mqttClient.publish(
      'shaurya/her_lamp/command',
      whatsappToLamp[incoming]
    );
  }

  res.send('<Response></Response>');
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
