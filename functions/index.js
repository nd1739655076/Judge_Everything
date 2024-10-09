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
    const { action, uidNum, username, password, email } = data;
    
    if (action === 'generate') {
      console.log("Checking if username exists:", username);
      
      // check whether the same username in Firebase database
      const usersRef = db.collection('User').where('username', '==', username);
      const querySnapshot = await usersRef.get();
      
      if (!querySnapshot.empty) {
        console.log("Username already exists.");
        throw new functions.https.HttpsError('already-exists', 'The username is already taken. Please choose another one.');
      }

      const newUser = new User(uidNum, username, password, email);
      console.log("Creating new user with ID:", uidNum);
      await newUser.generateUser();  // use generate user
      console.log("User successfully created.");

      return { success: true, message: "User successfully created" };
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid action.');
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
      const productEntry = new ProductEntry(prodidNum, productName, uidNum);
      await productEntry.generateProductEntry();
    } 
  } catch (error) {
    console.error('Error handling product entry request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle product entry request');
  }
});

exports.checkLoginStatus = functions.https.onCall(async (data, context) => {
  if (context.auth) {
    const uid = context.auth.uid;
    const userDoc = await admin.firestore().collection('Users').doc(uid).get();
    if (userDoc.exists) {
      return { loggedIn: true, username: userDoc.data().username };
    } else {
      return { loggedIn: false };
    }
  } else {
    return { loggedIn: false };
  }
});

exports.handleLogout = functions.https.onCall(async (data, context) => {
  return { success: true };
});
