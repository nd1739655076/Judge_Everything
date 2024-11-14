const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket('judge-everything.appspot.com');

const TagLibrary = require('./TagLibrary');

const Admin = require('./Admin');

const Id = require('./Id');
const User = require('./User');
const Conversation = require('./Conversation');
const ProductEntry = require('./ProductEntry');
const Comment = require('./Comment');

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

// Admin Handle
exports.handleAdminRequest = functions.https.onCall(async (data, context) => {
  const { action, username, password,  statusToken } = data;
  try {
    if (action === 'login') {
      // username, password
      const loginResponse = await Admin.login(username, password);
      if (loginResponse.status === 'success') {
        return { success: true, statusToken: loginResponse.statusToken };
      } else {
        return { success: false, message: loginResponse.message };
      }
    }
    else if (action === 'checkLoginStatus') {
      // statusToken
      console.log("start status check in index.js");
      const loginStatusResponse = await Admin.checkLoginStatus(statusToken);
      if (loginStatusResponse.status === 'success') {
        return { success: true,
          username: loginStatusResponse.username,
          uid: loginStatusResponse.uid,
          headAdmin: loginStatusResponse.headAdmin
        };
      } else {
        return { success: false, message: loginStatusResponse.message };
      }
    }
    else if (action === 'fetchAdmin') {
      console.log("start fetch index.js");
      const fetchAdminResponse = await Admin.fetchAdmin();
      if (fetchAdminResponse.status === 'success') {
        return { success: true,
          adminList: fetchAdminResponse.adminList
        };
      } else {
        return { success: false, message: fetchAdminResponse.message };
      }
    }
  } catch (error) {
    console.error("Error handeling admin request.");
    return { success: false, message: error.message }
  }
});

// Id Handle
exports.handleIdRequest = functions.https.onCall(async (data, context) => {
  try {
    const { action, type, name } = data;

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

    else if (action === 'recordBrowseHistory') {
      // productId, uid
      const recordHistoryResponse = await User.recordBrowseHistory(data);
      if (recordHistoryResponse.status === 'success') {
        return { success: true, message: recordHistoryResponse.message };
      } else {
        return { success: false, message: recordHistoryResponse.message };
      }    
    }

  } catch (error) {
    console.error('Error handling User request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle user request.');
  }
});

// Conversation Handle
exports.handleConversationRequest = functions.https.onCall(async (data, context) => {
  try {
    const { action, user1Id, user2Id, conversationId, senderId, content } = data;

    if (action === 'generate') {
      await generateConversation(user1Id, user2Id);
      return { success: true, message: 'Conversation generated successfully' };
    }

    else if (action === 'fetchUserConversation') {
      const conversations = await Conversation.fetchUserConversation(user1Id);
      return { success: true, data: conversations };
    }

    else if (action === 'sendMessage') {
      const message = await sendMessage(conversationId, senderId, content);
      return { success: true, message: 'Message sent successfully', data: message };
    }

  } catch (error) {
    console.error('Error handling conversation request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle conversation request');
  }
});

// ProductEntry Handle
exports.handleProductEntryRequest = functions.https.onCall(async (data, context) => {
  try {
    const { action, productId } = data;

    if (action === 'generate') {
      const productEntryResponse = await ProductEntry.saveProductEntry(data);
      return productEntryResponse;
    }

    else if (action === 'fetchProducts') {
      const productsResponse = await ProductEntry.fetchProducts();
      console.log("Fetch Products Response:", productsResponse);
      return productsResponse;
    }

    else if (action === 'getRelatedProducts') {
      if (!productId) {
        throw new functions.https.HttpsError('invalid-argument', 'Product ID is required');
      }
      const relatedProductsResponse = await ProductEntry.getRelatedProducts(productId);
      return relatedProductsResponse;
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
    const { action, title, content, averageRating, parameterRatings, user, productId, commentId, uid, isLike, parentCommentId } = data;

    if (action === 'generate') {
      try {
        console.log("Generating comment...");
        const generateId = new Id();
        const { idNum: commentId } = await generateId.generateId('comment', title);
        console.log("Generated comment ID:", commentId);

        const newComment = {
          commentId,
          title,
          content,
          averageRating,
          parameterRatings,
          user,
          productId,
          timestamp: new Date(),
          likes: [],
          dislikes: [],
          likeAmount: 0,
          dislikeAmount: 0,
        };
        console.log("New comment data:", newComment);

        // Step 1: 存储评论数据
        await db.collection('Comments').doc(commentId).set(newComment);
        console.log("Comment added to Comments collection.");

        // Step 2: 更新 ProductEntry 中的 commentList
        const productRef = db.collection('ProductEntry').doc(productId);
        await productRef.update({
          commentList: admin.firestore.FieldValue.arrayUnion(commentId)
        });
        console.log("Comment added to ProductEntry's commentList.");
            
        // Step 3: save history in user's info
        const userRef = db.collection('User').doc(user.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error('Invalid user');
        const userData = userDoc.data();
        const currentHistory = userData.rateCommentHistory || [];
        const updatedHistory = [commentId, ...currentHistory];
        await userRef.update({
          rateCommentHistory: updatedHistory
        });
        console.log("Comment added to history.");
        return { success: true, message: 'Comment created successfully!' };
      } catch (error) {
        console.error("Error during comment generation:", error);
        return { success: false, message: 'Failed to create comment.', error: error.message };
      }
    } else if (action === 'addReply') {
      // 添加回复
      const { content, user, productId, parentCommentId } = data;

      if (!content || !user || !productId) {
        throw new Error("Missing required fields for adding a reply");
      }

      await Comment.addReply({
        content,
        user,
        productId,
        parentCommentId,
      });

      console.log("User data:", user);
      return { success: true, message: 'Reply added successfully!' };
    } else if (action === 'likeDislike') {
      // Step 4: 处理点赞或反对逻辑
      const { commentId, uid, isLike } = data;
      const commentRef = db.collection('Comments').doc(commentId);
      const commentDoc = await commentRef.get();
      if (!commentDoc.exists) {
        throw new Error('Comment not found');
      }
      const commentData = commentDoc.data();
      let newLikes = [...(commentData.likes || [])];
      let newDislikes = [...(commentData.dislikes || [])];
      if (isLike) {
        if (newLikes.includes(uid)) {
          newLikes = newLikes.filter(id => id !== uid); // 取消点赞
        } else {
          newLikes.push(uid); // 添加点赞
          newDislikes = newDislikes.filter(id => id !== uid); // 移除反对
        }
      } else {
        if (newDislikes.includes(uid)) {
          newDislikes = newDislikes.filter(id => id !== uid); // 取消反对
        } else {
          newDislikes.push(uid); // 添加反对
          newLikes = newLikes.filter(id => id !== uid); // 移除点赞
        }
      }
      await commentRef.update({
        likes: newLikes,
        dislikes: newDislikes,
        likeAmount: newLikes.length,
        dislikeAmount: newDislikes.length,
      });
      return { success: true, message: 'Updated like/dislike successfully!' };
    }
    else if (action === 'getTopReplies') {
      // 获取按时间排序的前几条回复
      const recentReplies = await Comment.getTopReplies({
          commentId, 
          limit: data.limit || 3, 
          startAfter: data.startAfter || null // 添加分页参数
      });
      return { success: true, replies: recentReplies };
  } else {
      throw new Error("Invalid action specified");
  }

  } catch (error) {
    console.error('Error handling comment request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle comment request');
  }
});

exports.handleReportProduct = functions.https.onCall(async (data, context) => {
  const { productId, reportReason, reporter } = data;

  try {
    const result = await ProductEntry.reportProduct(productId, reportReason, reporter);
    return { success: true, message: result.message };
  } catch (error) {
    console.error("Error reporting product:", error);
    return { success: false, message: error.message };
  }
});

// Handle updating product report flags
exports.handleUpdateProductReportFlags = functions.https.onCall(async (data, context) => {
  const { productId } = data;

  try {
    const result = await ProductEntry.updateProductReportFlags(productId);
    return { success: true, message: result.message };
  } catch (error) {
    console.error("Error updating product report flags:", error);
    return { success: false, message: error.message };
  }
});