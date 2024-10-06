const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

const Id = require('./Id');
const User = require('./User');

exports.handleIdRequest = functions.https.onCall(async (data, context) => {
  try {
    if (action === 'generate') {
      const newId = new Id();
      const result = await newId.generateId(data.type, data.name);
      return result;
    }
  } catch (error) {
    console.error('Error generating ID:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate ID.');
  }
});

exports.handleUserRequest = functions.https.onCall(async (data, context) => {
  try {
    if (action === 'generate') {
      const newUser = new User(data.uid, data.username, data.password, data.email);
      await newUser.generateUser();
    } 
  } catch (error) {
    console.error('Error handling user request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle user request');
  }
});