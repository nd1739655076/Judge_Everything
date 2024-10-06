const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

const Id = require('./Id');

exports.generateIdRequest = functions.https.onCall(async (data, context) => {
  try {
    const newId = new Id();
    const result = await newId.generateId(data.type, data.name);
    return result;
  } catch (error) {
    console.error('Error generating ID:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate ID.');
  }
});