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
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return;
  }

  const formattedData = {};
  for (const key in data) {
    formattedData[key] = String(data[key]);
  }

  const promises = tokens.map(async (token) => {
    const message = {
      token,
      notification: {
        title: data?.title || "Notification",
        body: data?.body || "",
      },
      data: formattedData,
      android: {
        priority: "high",
        notification: {
          channelId: "default",
        },
      },
    };

    try {
      const response = await admin.messaging().send(message);
      return { token, status: "success" };
    } catch (error) {
      if (
        error.code === "messaging/invalid-argument" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        await notificationmodel.updateMany(
          { device_token: token },
          { $pull: { device_token: token } }
        );
      }

      return { token, status: "failed", error: error.message };
    }
  });

  const results = await Promise.all(promises);
  console.log(results);
  return results;
}

module.exports = { sendNotifications };
