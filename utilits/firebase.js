const admin = require("firebase-admin");
const notificationmodel = require("../models/notification.model");
require('dotenv').config()

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function sendNotifications(tokens = [], message, type = "system", shouldSave = false) {
  if (!tokens.length) {
    throw new Error("Token array is empty");
  }
  if (!message) {
    throw new Error("Message is required");
  }

  const payload = {
    notification: {
      title: "Notification",
      body: message,
    },
    data: {
      type: type,
      message: message,
    },
  };

  try {
    // Send notifications to all tokens
    const response = await admin.messaging().sendToDevice(tokens, payload);
    if (shouldSave) {
      const notificationDoc = new notificationmodel({
        token: tokens,
        message,
        type,
      });
      await notificationDoc.save();
    }

    return response;
  } catch (error) {
    console.error("Error sending notifications:", error);
    throw error;
  }
}

module.exports = { sendNotifications };
