const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket('judge-everything.appspot.com');

const TagLibrary = require('./TagLibrary');
const Id = require('./Id');
const User = require('./User');
const Comment = require('./Comment');
const ProductEntry = require('./ProductEntry');

// TagLibrary Handle
exports.handleTagLibraryRequest = functions.https.onCall(async (data, context) => {
  try {
    const { action } = data;
    
    if (action === 'initializeTagLibrary') {
      // action
      const initializeResponse = await TagLibrary.initializeTagLibrary();
      if (initializeResponse.status === 'success') {
        return { success: true, message: initializeResponse.message };
      }
    } 
    
    else if (action === 'getTagLibrary') {
      // action
      const getTagLibraryResponse = await TagLibrary.getTagLibrary();
      if (getTagLibraryResponse.status === 'success') {
        return { success: true, tagList: getTagLibraryResponse.tagList };
      }
    } 

  } catch (error) {
    console.error('Error handling TagLibrary request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle TagLibrary request.');
  }
});

// Id Handle
exports.handleIdRequest = functions.https.onCall(async (data, context) => {
  try {
    const {action, type, name} = data;

    if (action === 'generate') {
      // type, name
      const newId = new Id();
      const idResponse = await newId.generateId(type, name);
      return idResponse;
    }

  } catch (error) {
    console.error('Error handling Id request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle Id request.');
  }
});

// User Handle
exports.handleUserRequest = functions.https.onCall(async (data, context) => {
  try {
    const { action, username, password, email, gender, ageRange, selectedTags,
      statusToken, uidNum, nickname, preferences } = data;

    if (action === 'generate') {
      // username, password, email
      const userDocRef = db.collection('User').where('username', '==', username);
      const userDoc = await userDocRef.get();
      if (!userDoc.empty) {
        return { success: false, message: "Username exist" };
      }
      const newId = new Id();
      const idResponse = await newId.generateId('user', username);
      const uidNum = idResponse.idNum;
      const newUser = new User(uidNum, username, password, email);
      await newUser.generateUser();
      return { success: true, message: "Sign up successful! You can now log in." };
    }

    else if (action === 'retrievePassword') {
      // username, email
      const retrieveResponse = await User.retrievePassword(username, email);
      if (retrieveResponse.status === 'success') {
        return { success: true, password: retrieveResponse.password };
      } else {
        return { success: false, message: retrieveResponse.message };
      }
    }

    else if (action == 'login') {
      // username, password
      const loginResponse = await User.login(username, password);
      if (loginResponse.status === 'success') {
        return { success: true, statusToken: loginResponse.statusToken };
      } else {
        return { success: false, message: loginResponse.message };
      }
    }

    else if (action === 'checkFirstLogin') {
      // username
      const checkFirstLoginResponse = await User.checkFirstLogin(username);
      if (checkFirstLoginResponse.status === 'success') {
        return { success: true, message: checkFirstLoginResponse.message };
      } else {
        return { success: false, message: checkFirstLoginResponse.message };
      }
    }

    else if (action === 'setFirstLoginFalse') {
      // username
      const setFirstLoginFalseResponse = await User.setFirstLoginFalse(username);
      if (setFirstLoginFalseResponse.status === 'success') {
        return { success: true, message: setFirstLoginFalseResponse.message };
      } else {
        return { success: false, message: setFirstLoginFalseResponse.message };
      }
    }

    else if (action === 'updatePreferences') {
      // username, gender, ageRange, selectedTags
      const preferencesResponse = await User.updatePreferences(username, gender, ageRange, selectedTags);
      if (preferencesResponse.status === 'success') {
        return { success: true, message: preferencesResponse.message };
      } else {
        return { success: false, message: preferencesResponse.message };
      }
    }

    else if (action === 'checkLoginStatus') {
      // statusToken
      const loginStatusResponse = await User.checkLoginStatus(statusToken);
      if (loginStatusResponse.status === 'success') {
        return { success: true, username: loginStatusResponse.username, uid: loginStatusResponse.uid };
      } else {
        return { success: false, message: loginStatusResponse.message };
      }
    }

    else if (action === 'logout') {
      // statusToken
      const logoutResponse = await User.logout(statusToken);
      if (logoutResponse.status === 'success') {
        return { success: true, message: logoutResponse.message };
      } else {
        return { success: false, message: logoutResponse.message };
      }
    }

    else if (action === 'getUserData') {
      // uidNum
      const userDataResponse = await User.getUserData(uidNum);
      if (userDataResponse.status === 'success') {
        return { success: true, data: userDataResponse.data };
      } else {
        return { success: false, message: userDataResponse.message };
      }
    }

    else if (action === 'accountSetting') {
      // username, password, email, nickname, uidNum, nickname, preferences
      const accountUpdateResponse = await User.accountSetting(uidNum, username, password, email, nickname, preferences);
      if (accountUpdateResponse.status === 'success') {
        return { success: true, message: accountUpdateResponse.message };
      } else {
        return { success: false, message: accountUpdateResponse.message };
      }
    }

    else if (action === 'delete') {
      // uidNum
      const deleteResponse = await User.delete(uidNum);
      if (deleteResponse.status === 'success') {
        return { success: true, message: deleteResponse.message };
      } else {
        return { success: false, message: deleteResponse.message };
      }
    }

  } catch (error) {
    console.error('Error handling User request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle user request.');
  }
});

// ProductEntry Handle
exports.handleProductEntryRequest = functions.https.onCall(async (data, context) => {
  try {
    const { action } = data;

    if (action === 'generate') {
      const productEntryResponse = await ProductEntry.saveProductEntry(data);
      return productEntryResponse;
    }

    else if (action === 'fetchProducts') {
      const productsResponse = await ProductEntry.fetchProducts();
      console.log("Fetch Products Response:", productsResponse);
      return productsResponse;
    }
    
  } catch (error) {
    console.error('Error handling product entry request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle product entry request');
  }
});

// Image Handle
exports.handleImageRequest = functions.https.onCall(async (data, context) => {
  try {
    const { action, base64, filename, userId, productId } = data;

    if (action === 'upload') {
      if (!base64 || !filename || (!userId && !productId)) {
        return { success: false, message: 'Invalid input parameters' };
      }
      const buffer = Buffer.from(base64, 'base64');
      let imageUrl = '';
      let docRef = null;
      let oldImageUrl = '';
      if (userId) {
        docRef = db.collection('User').doc(userId);
        const userDoc = await docRef.get();
        if (userDoc.exists && userDoc.data().profileImage) {
          oldImageUrl = userDoc.data().profileImage;
        }
        const userImageFilePath = `userImage/${userId}/${filename}`;
        const userImageFile = bucket.file(userImageFilePath);
        if (oldImageUrl) {
          const oldImagePath = oldImageUrl.split('/').slice(-2).join('/');
          const oldFile = bucket.file(oldImagePath);
          await oldFile.delete().catch((error) => {
            console.error('Error deleting old image:', error);
          });
        }
        await userImageFile.save(buffer, {
          contentType: 'image/jpeg',
          public: true,
        });
        imageUrl = userImageFile.publicUrl();
        await docRef.update({
          profileImage: imageUrl,
        });
      }
      else if (productId) {
        docRef = db.collection('ProductEntry').doc(productId);
        const productDoc = await docRef.get();
        if (productDoc.exists && productDoc.data().productImage) {
          oldImageUrl = productDoc.data().productImage;
        }
        const productImageFilePath = `productImage/${productId}/${filename}`;
        const productImageFile = bucket.file(productImageFilePath);
        if (oldImageUrl) {
          const oldImagePath = oldImageUrl.split('/').slice(-2).join('/');
          const oldFile = bucket.file(oldImagePath);
          await oldFile.delete().catch((error) => {
            console.error('Error deleting old image:', error);
          });
        }
        await productImageFile.save(buffer, {
          contentType: 'image/jpeg',
          public: true,
        });
        imageUrl = productImageFile.publicUrl();
        await docRef.update({
          productImage: imageUrl,
        });
      }
      return {
        success: true,
        message: 'Image uploaded, old image deleted, and metadata updated successfully.',
        imageUrl: imageUrl,
      };
    }
    
  } catch (error) {
      console.error('Error uploading image and deleting old image:', error);
      throw new functions.https.HttpsError('internal', 'Failed to upload image and store metadata');
  }
});

//this function is used for write the comment to a product with its scores and id.
exports.handleCommentRequest = functions.https.onCall(async (data, context) => {
  try {
    const { action, title, content, averageRating, parameterRatings, user, productId } = data;

    if (action === 'generate') {
      // generate the id of the comment
      const generateId = new Id();
      const commentIdResult = await generateId.generateId('comment', title);
      const commentId = commentIdResult.idNum;

      // create and generate the comment
      const newComment = new Comment(commentId, title, content, averageRating, parameterRatings, user, productId);
      await newComment.generateComment();

      // update the comment list in the product entry
      const productRef = db.collection('ProductEntry').doc(productId);
      await productRef.update({
        commentList: admin.firestore.FieldValue.arrayUnion(commentId)
      });
      
      console.log('Comment successfully created and added to product entry.');

      return { message: 'Comment created successfully!' };
    }
  } catch (error) {
    console.error('Error handling comment request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle comment request');
  }
});