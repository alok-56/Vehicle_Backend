const admin = require("firebase-admin");
const notificationmodel = require("../models/notification.model");
require("dotenv").config();

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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

async function sendNotifications(tokens = [], data = {}) {
  if (!tokens || tokens.length === 0) {
    throw new Error("Tokens must be a non-empty array");
  }

  const formattedData = {};
  for (const key in data) {
    formattedData[key] = String(data[key]);
  }

  const promises = tokens.map((token) => {
    const message = {
      token,
      notification: {
        title: data?.title,
        body: data?.body,
      },
      data: formattedData,
      android: {
        priority: "high",
        notification: {
          channelId: "default",
        },
      },
    };
    return admin.messaging().send(message);
  });

  try {
    const responses = await Promise.all(promises);
    return responses;
  } catch (error) {
    throw error;
  }
}

module.exports = { sendNotifications };
