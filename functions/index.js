/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true });
admin.initializeApp(); // Initialize the Firebase Admin SDK

const Id = require('./Id'); // Import the Id class

// HTTP Callable Cloud Function to generate an ID
exports.generateIdRequest = functions.https.onCall(async (data, context) => {
  try {
    // Validate that the required data is present
    const { type, name } = data;
    console.log('Received type:', type);
    if (!type || !name) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with both "type" and "name" arguments.');
    }

    // Create a new instance of the Id class
    const idGenerator = new Id();
    
    // Generate the ID using the provided type and name
    const result = await idGenerator.generateId(type, name);

    // Return the result to the client
    return result;
  } catch (error) {
    console.error('Error generating ID:', error);
    
    // Throw a detailed error that will be passed to the client
    throw new functions.https.HttpsError('internal', 'Failed to generate ID: ' + error.message);
  }
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
