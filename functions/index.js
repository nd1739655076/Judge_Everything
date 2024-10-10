const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true });
admin.initializeApp();

const db = admin.firestore();

const Id = require('./Id');
const User = require('./User');
const ProductEntry = require('./ProductEntry');

exports.handleIdRequest = functions.https.onCall(async (data, context) => {
  try {
    const {action, type, name} = data;
    if (action === 'generate') {
      const newId = new Id();
      const result = await newId.generateId(type, name);
      return result;
    }
  } catch (error) {
    console.error('Error generating ID:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate ID.');
  }
});

exports.handleUserRequest = functions.https.onCall(async (data, context) => {
  try {
    const { action, username, password, email, statusToken} = data;
    if (action === 'generate') {
      // username, password, email
      console.log('Generating user for username:', username);
      const userDocRef = db.collection('User').where('username', '==', username);
      const userSnapshot = await userDocRef.get();
      if (!userSnapshot.empty) {
        return { success: false, message: "Username exist" };
      }
      const newId = new Id();
      const idResponse = await newId.generateId('user', username);
      const uidNum = idResponse.idNum;
      const newUser = new User(uidNum, username, password, email);
      await newUser.generateUser();
      return { success: true, message: "Sign up successful! You can now log in." };
    }

    else if (action == 'login') {
      // username, password
      console.log('Login request for username:', username);
      const loginResult = await User.login(username, password);
      if (loginResult.status === 'success') {
        return { success: true, statusToken: loginResult.statusToken };
      } else {
        return { success: false, message: loginResult.message };
      }
    }

    else if (action === 'checkLoginStatus') {
      console.log('Checking login status with statusToken:', statusToken);
      const loginStatusResult = await User.checkLoginStatus(statusToken);
      return loginStatusResult;
    }

    else if (action === 'logout') {
      console.log('Logout request with statusToken:', statusToken);
      const logoutResult = await User.logout(statusToken);
      if (logoutResult.status === 'success') {
        return logoutResult;
      } else {
        throw new functions.https.HttpsError('unauthenticated', logoutResult.message);
      }
    }

  } catch (error) {
    console.error('Error handling user request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle user request.');
  }
});

exports.handleProductEntryRequest = functions.https.onCall(async (data, context) => {
  try {
    const {action, prodidNum, productName, uidNum} = data;
    if (action === 'generate') {
      const newProductEntry = new ProductEntry(prodidNum, productName, uidNum);
      await newProductEntry.generateProductEntry();
    } 
  } catch (error) {
    console.error('Error handling product entry request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle product entry request');
  }
});