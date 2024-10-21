const admin = require('firebase-admin');
//const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');

const db = admin.firestore();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key';

class User {
  constructor(uidNum, username, password, email) {
    this.id = uidNum;
    this.username = username;
    this.password = password;
    this.email = email;
    this.nickname = '';
    this.age = '';
    this.gender = '';
    this.preferences = [null, null, null, null, null];
    this.productProfileCreateHistory = [];
    this.followingList = [];
    this.followers = [];
    this.conversationList = [];
    this.searchHistory = [];
    this.browseHistory = [];
    this.rateCommentHistory = [];
  }

  // helper
  // static async hashPassword(password) {
  //   const saltRounds = 10;
  //   return await bcrypt.hash(password, saltRounds);
  // }

  // action === 'generate'
  async generateUser() {
    //const hashedPassword = await User.hashPassword(this.password);
    const userDocRef = db.collection('User').doc(this.id);
    await userDocRef.set({
      id: this.id,
      username: this.username,
      //password: hashedPassword,
      password: this.password,
      email: this.email,
      nickname: null,
      age: null,
      gender: null,
      preferences: null,
      productProfileCreateHistory: null,
      followingList: null,
      followers: null,
      conversationList: null,
      searchHistory: null,
      browseHistory: null,
      rateCommentHistory: null,
    });
  }

  // action == 'retrievePassword'
  static async retrievePassword(username, email) {
    const userDocRef = db.collection('User').where('username', '==', username);
    const userDocRefSnapshot = await userDocRef.get();
    if (userDocRefSnapshot.empty) {
      return { status: 'error', message: 'User not exist' };
    }
    const userDoc = userDocRefSnapshot.docs[0];
    const userDocData = userDoc.data();
    if (email !== userDocData.email) {
      return { status: 'error', message: 'Username and email not match' };
    }
    return { status: 'success', password: userDocData.password };
  }

  // helper
  // static async comparePasswords(plainPassword, hashedPassword) {
  //   return await bcrypt.compare(plainPassword, hashedPassword);
  // }

  // helper
  static generateStatusToken(username, uid) {
    const payload = {
      username: username,
      uid: uid,
      iat: Math.floor(Date.now() / 1000),
    };
    const options = {
      expiresIn: '1h',
    };
    const token = jwt.sign(payload, JWT_SECRET, options);
    return token;
  }

  // action == 'login'
  static async login(username, password) {
    const userDocRef = db.collection('User').where('username', '==', username);
    const userDocRefSnapshot = await userDocRef.get();
    if (userDocRefSnapshot.empty) {
      return { status: 'error', message: 'User not exist' };
    }
    const userDoc = userDocRefSnapshot.docs[0];
    const userDocData = userDoc.data();
    //const isPasswordValid = await User.comparePasswords(password, userDocData.password);
    if (password !== userDocData.password) {
      return { status: 'error', message: 'Invalid password' };
    }
    const statusToken = User.generateStatusToken(username, userDocData.id);
    await userDoc.ref.update({ statusToken });
    return { status: 'success', statusToken: statusToken };
  }

  // action == 'checkFirstLogin'
  static async checkFirstLogin(username) {
    const userDocRef = db.collection('User').where('username', '==', username);
    const userDocRefSnapshot = await userDocRef.get();
    if (userDocRefSnapshot.empty) {
      return { status: 'error', message: 'User not found' };
    }
    const userDoc = userDocRefSnapshot.docs[0];
    const userDocData = userDoc.data();
    let isFirstLogin = userDocData.firstLogin;
    if (isFirstLogin === undefined || isFirstLogin === true) {
      await userDoc.ref.update({ firstLogin: true });
      return { status: 'success', message: 'Hello, new user! It will help if you accomplish a preference survey first.' };
    }
    else {
      return { status: 'error', message: 'This user has already logged in before.' };
    }
  }

  // action == 'setFirstLoginFalse'
  static async setFirstLoginFalse(username) {
    const userDocRef = db.collection('User').where('username', '==', username);
    const userDocRefSnapshot = await userDocRef.get();
    if (userDocRefSnapshot.empty) {
      return { status: 'error', message: 'User not found' };
    }
    const userDoc = userDocRefSnapshot.docs[0];
    await userDoc.ref.update({ firstLogin: false });
    return { status: 'success', message: 'First login status updated to false.' };
  }

  // action == 'updatePreferences'
  static async updatePreferences(username, gender, ageRange, selectedTags) {
    const userDocRef = db.collection('User').where('username', '==', username);
    const userDocRefSnapshot = await userDocRef.get();
    if (userDocRefSnapshot.empty) {
      return { status: 'error', message: 'User not found' };
    }
    const userDoc = userDocRefSnapshot.docs[0];
    let updateData = {};
    if (gender === 'male') {
      updateData.gender = 'male';
    } else if (gender === 'female') {
      updateData.gender = 'female';
    } else if (gender === 'other') {
      updateData.gender = 'other';
    } else if (gender === 'preferNotToSay') {
      updateData.gender = '';
    }
    updateData.ageRange = ageRange;
    updateData.preferences = selectedTags || [null, null, null, null, null];
    await userDoc.ref.update(updateData);
    return { status: 'success', message: 'Preferences updated successfully.' };
  }

  // helper
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { status: 'success', user: decoded };
    } catch (error) {
      return { status: 'error', message: 'Invalid or expired token' };
    }
  }

  // action === 'checkLoginStatus'
  static async checkLoginStatus(token) {
    const verificationResponse = User.verifyToken(token);
    if (verificationResponse.status === 'error') {
      return { status: 'error', message: verificationResponse.message };
    }
    const uid = verificationResponse.user.uid;
    if (!uid) {
      return { status: 'error', message: 'Invalid UID' };
    }
    const userDoc = await db.collection('User').doc(uid).get();
    if (userDoc.exists) {
      const userDocData = userDoc.data();
      return { status: 'success', username: userDocData.username, uid: userDocData.id };
    } else {
      return { status: 'error', message: 'User not found' };
    }
  }

  // action === 'logout'
  static async logout(token) {
    const verificationResult = User.verifyToken(token);
    if (verificationResult.status === 'error') {
      return { status: 'error', message: verificationResult.message };
    }
    const uid = verificationResult.user.uid;
    const userDocRef = db.collection('User').doc(uid);
    await userDocRef.update({ statusToken: null });
    return { status: 'success', message: 'User logged out successfully' };
  }

  // action === 'getUserData'
  static async getUserData(uid) {
    const userDocRef = db.collection('User').doc(uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return { status: 'error', message: 'User not found' };
    }
    const userDocData = userDoc.data();
    return {
      status: 'success',
      data: {
        id: userDocData.id,
        username: userDocData.username,
        password: userDocData.password,
        email: userDocData.email,
        nickname: userDocData.nickname,
        preferences: userDocData.preferences,
        productProfileCreateHistory: userDocData.productProfileCreateHistory,
        followingList: userDocData.followingList,
        followers: userDocData.followers,
        conversationList: userDocData.conversationList,
        searchHistory: userDocData.searchHistory,
        browseHistory: userDocData.browseHistory,
        rateCommentHistory: userDocData.rateCommentHistory,
        profileImage: userDocData.profileImage || '',
      },
    };
  }

  // action === 'accountSetting'
  static async accountSetting(uid, username, password, email, nickname, preferences) {
    const userDocRef = db.collection('User').doc(uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return { status: 'error', message: 'User not found' };
    }
    if (username) {
      const usernameQuery = await db.collection('User')
        .where('username', '==', username)
        .get();
      if (!usernameQuery.empty) {
        const otherUserDoc = usernameQuery.docs[0];
        if (otherUserDoc.id !== uid) {
          return { status: 'error', message: 'Username already exists.' };
        }
      }
    }
    const updateData = {};
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (email) updateData.email = email;
    if (nickname) updateData.nickname = nickname;
    if (preferences) updateData.preferences = preferences;
    await userDocRef.update(updateData);
    return { status: 'success', message: 'User data updated successfully' };
  }

  // action === 'delete'
  static async delete(uid) {
    const userDocRef = db.collection('User').doc(uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return { status: 'error', message: 'User not found' };
    }
    await userDocRef.delete();
    return { status: 'success', message: 'User account deleted successfully' }
  }

}

module.exports = User;