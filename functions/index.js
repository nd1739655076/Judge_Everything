const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

const TagLibrary = require('./TagLibrary');
const Id = require('./Id');
const User = require('./User');
const Parameter = require('./Parameter');
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
    const { action, username, password, email, statusToken, uidNum, nickname, preferences } = data;

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

  //   else if (action === 'reset') {
  //     console.log("call to index.js");
  //     const resetResponse = await User.resetPassword(email, uidNum);
  //     console.log("call complete");
  //     if (resetResponse.status === 'success') {
  //       return { success: true, message: resetResponse.message };
  //     } else {
  //       return { success: false, message: resetResponse.message };
  //     }
  //  }

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
    const { action, productName, uidNum, tags, paramList, description, imageBase64, imageName } = data;
    if (action === 'generate') {
      const generateId = new Id();
      const productIdResult = await generateId.generateId('productEntry', productName);
      const prodidNum = productIdResult.idNum;
      const newProductEntry = new ProductEntry(prodidNum, productName, uidNum, description);
      const parameterIds = [];

      if (paramList && paramList.length > 0) {
        for (let i = 0; i < paramList.length; i++) {
          // Generate parameter ID using the custom ID generation function
          const paramIdResult = await generateId.generateId('parameter', paramList[i]);
          const paramId = paramIdResult.idNum; // Extract the generated parameter ID
          const paramName = paramList[i]; // Parameter name

          console.log(`Creating parameter ${i + 1}: ID ${paramId}, Name: ${paramName}`);

          const parameter = new Parameter(paramId, prodidNum, paramName); // Create new parameter

          // Save the parameter to Firestore
          await parameter.save(); // Save parameter to Firestore
          
          parameterIds.push(paramId); // Add the parameter ID to the list

          console.log(`Parameter ${i + 1} saved: ID ${paramId}`);
        }
      }
      let productImageUrl = '';
      if (imageBase64 && imageName) {
        const handleImageUpload = httpsCallable(functions, 'handleImageRequest');
        const imageResult = await handleImageUpload({
          action: 'upload',
          base64: imageBase64,
          filename: imageName,
          productId: prodidNum,
        });

        if (imageResult.data.success) {
          productImageUrl = imageResult.data.imageUrl;
        } else {
          console.error('Image upload failed:', imageResult.data.message);
        }
      }
      newProductEntry.parametorList = parameterIds;
      newProductEntry.tagList = tags; 
      await newProductEntry.generateProductEntry();
      console.log('Product entry successfully created.');
      return {
        success: true,
        idNum: prodidNum,  // Make sure to include the product ID in the response
        message: 'Product entry created successfully!'
      };
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
      if (userId) {
        const userImageFilePath = `userImage/${userId}/${filename}`;
        const userImageFile = bucket.file(userImageFilePath);
        await userImageFile.save(buffer, {
          contentType: 'image/jpeg',
          public: true,
        });
        imageUrl = userImageFile.publicUrl();
        docRef = db.collection('User').doc(userId);
        await docRef.update({
          profileImage: imageUrl
        });
      }
      else if (productId) {
        const productImageFilePath = `productImage/${productId}/${filename}`;
        const productImageFile = bucket.file(productImageFilePath);
        await productImageFile.save(buffer, {
          contentType: 'image/jpeg',
          public: true,
        });
        imageUrl = productImageFile.publicUrl();
        docRef = db.collection('ProductEntry').doc(productId);
        await docRef.update({
          productImage: imageUrl
        });
      }
      return {
        success: true,
        message: 'Image uploaded and metadata stored successfully.',
        imageUrl: imageUrl
      };
    }
    
  } catch (error) {
      console.error('Error uploading image:', error);
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

//This function is used for the preference survey's writing
exports.handleUserPreferences = functions.https.onCall(async (data, context) => {
  try {
    const { username, gender, ageRange, selectedTags } = data;
    const preferencesResponse = await User.updatePreferences(username, gender, ageRange, selectedTags);
    if (preferencesResponse.status === 'success') {
      return { success: true, message: preferencesResponse.message };
    } else {
      return { success: false, message: preferencesResponse.message };
    }
  } catch (error) {
    console.error('Error handling user preferences request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle user preferences request.');
  }
});