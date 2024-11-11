const admin = require('firebase-admin');
//const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');

const db = admin.firestore();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key';
// NOTE!! not tested!
class Admin {
  constructor(uid, username, password, headAdmin) {
    this.uid = uid;
    this.username = username;
    this.password = password;
    this.statusToken = "";
    this.headAdmin = headAdmin;
  }

  // action === 'generate'
  // NOTE!! not edited, may not work!
  async generateUser() {
    //const hashedPassword = await User.hashPassword(this.password);
    const userDocRef = db.collection('Admin').doc(this.uid);
    await userDocRef.set({
      uid: this.uid,
      username: this.username,
      password: this.password,
      headAdmin: this.headAdmin
    });
  }

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
    const userDocRef = db.collection('Admin').where('username', '==', username);
    const userDocRefSnapshot = await userDocRef.get();
    if (userDocRefSnapshot.empty) {
      return { status: 'error', message: 'Admin not exist' };
    }
    const userDoc = userDocRefSnapshot.docs[0];
    const userDocData = userDoc.data();
    if (password !== userDocData.password) {
      return { status: 'error', message: 'Invalid password' };
    }
    const statusToken = Admin.generateStatusToken(username, userDocData.uid);
    await userDoc.ref.update({ statusToken });
    return { status: 'success', statusToken: statusToken };
  }

//   // action == 'checkFirstLogin'
//   static async checkFirstLogin(username) {
//     const userDocRef = db.collection('User').where('username', '==', username);
//     const userDocRefSnapshot = await userDocRef.get();
//     if (userDocRefSnapshot.empty) {
//       return { status: 'error', message: 'User not found' };
//     }
//     const userDoc = userDocRefSnapshot.docs[0];
//     const userDocData = userDoc.data();
//     let isFirstLogin = userDocData.firstLogin;
//     if (isFirstLogin === undefined || isFirstLogin === true) {
//       await userDoc.ref.update({ firstLogin: true });
//       return { status: 'success', message: 'Hello, new user! It will help if you accomplish a preference survey first.' };
//     }
//     else {
//       return { status: 'error', message: 'This user has already logged in before.' };
//     }
//   }

  // helper
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { status: 'success', admin: decoded };
    } catch (error) {
      return { status: 'error', message: 'Invalid or expired token' };
    }
  }

  // action === 'checkLoginStatus'
  static async checkLoginStatus(token) {
    const verificationResponse = Admin.verifyToken(token);
    if (verificationResponse.status === 'error') {
      return { status: 'error', message: verificationResponse.message };
    }
    const uid = verificationResponse.admin.uid;
    if (!uid) {
      return { status: 'error', message: 'Invalid UID' };
    }
    const userDoc = await db.collection('Admin').doc(uid).get();
    if (userDoc.exists) {
      const userDocData = userDoc.data();
      return { status: 'success',
                username: userDocData.username,
                uid: userDocData.uid,
                headAdmin: userDocData.headAdmin };
    } else {
      return { status: 'error', message: 'User not found' };
    }
  }

  // action === 'logout'
  static async logout(token) {
    const verificationResult = Admin.verifyToken(token);
    if (verificationResult.status === 'error') {
      return { status: 'error', message: verificationResult.message };
    }
    const uid = verificationResult.admin.uid;
    const userDocRef = db.collection('Admin').doc(uid);
    await userDocRef.update({ statusToken: null });
    return { status: 'success', message: 'Admin logged out successfully' };
  }

//   // action === 'getUserData'
//   static async getUserData(uid) {
//     const userDocRef = db.collection('User').doc(uid);
//     const userDoc = await userDocRef.get();
//     if (!userDoc.exists) {
//       return { status: 'error', message: 'User not found' };
//     }
//     const userDocData = userDoc.data();
//     return {
//       status: 'success',
//       data: {
//         id: userDocData.id,
//         username: userDocData.username,
//         password: userDocData.password,
//         email: userDocData.email,
//         nickname: userDocData.nickname,
//         preferences: userDocData.preferences,
//         productProfileCreateHistory: userDocData.productProfileCreateHistory,
//         followingList: userDocData.followingList,
//         followers: userDocData.followers,
//         conversationList: userDocData.conversationList,
//         searchHistory: userDocData.searchHistory,
//         browseHistory: userDocData.browseHistory,
//         rateCommentHistory: userDocData.rateCommentHistory,
//         profileImage: userDocData.profileImage || '',
//       },
//     };
//   }

  // action === 'delete'
  static async delete(uid) {
    const userDocRef = db.collection('Admin').doc(uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return { status: 'error', message: 'Admin not found' };
    }
    await userDocRef.delete();
    return { status: 'success', message: 'Admin account deleted successfully' }
  }

  //action === 'fetchAdmin'
  static async fetchAdmin() {
    try {
      console.log("fetch admin in Admin.js");
      const AdminDocRef = db.collection("Admin");
      const adminSnapshot = await AdminDocRef.get();
      console.log("adminSnapshot:",adminSnapshot);
      const adminList = adminSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("doc:",data.uid,",",data.username,",",data.headAdmin);
        return {
          id: data.uid,
          username: data.username,
          headAdmin: data.headAdmin
        };
      });
      console.log("admin list:", adminList);
      return { status: 'success', adminList: adminList };
    } catch (error) {
      console.error("Error fetching admin list:", error);
      return { status: 'error', message: `Error fetching admin list:${error}` };
    }

  }

}

module.exports = Admin;