const admin = require('firebase-admin');
//const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');

const db = admin.firestore();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key';

const ProductEntry = require('./ProductEntry');


class Admin {
  constructor(uid, username, password, headAdmin) {
    this.uid = uid;
    this.username = username;
    this.password = password;
    this.statusToken = "";
    this.headAdmin = headAdmin;
  }

  // action === 'create'
  async createAdmin() {
    //const hashedPassword = await User.hashPassword(this.password);
    const userDocRef = db.collection('Admin').doc(this.uid);
    await userDocRef.set({
      uid: this.uid,
      username: this.username,
      password: this.password,
      statusToken: "",
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
    return { status: 'success', statusToken: statusToken, headAdmin: userDocData.headAdmin };
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
    console.log("logout in Admin");
    const verificationResult = Admin.verifyToken(token);
    if (verificationResult.status === 'error') {
      return { status: 'error', message: verificationResult.message };
    }
    const uid = verificationResult.admin.uid;
    const userDocRef = db.collection('Admin').doc(uid);
    await userDocRef.update({ statusToken: "" });
    return { status: 'success', message: 'Admin logged out successfully' };
  }


  // action === 'delete'
  static async delete(uid) {
    console.log("delete in Admin");
    const userDocRef = db.collection('Admin').doc(uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return { status: 'error', message: 'Admin not found' };
    }
    await userDocRef.delete();
    const idDocRef = db.collection('Id').doc(uid);
    const idDoc = await idDocRef.get();
    if (idDoc.exists) {
      await idDocRef.delete();
    }
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

  //action === 'edit'
  static async edit(uid, username, password, headAdmin) {
    console.log("Edit admin ", uid, ",username:", username, ",password:", password, "headadmin: ", headAdmin);
    const adminDocRef = db.collection('Admin').doc(uid);
    if (adminDocRef.empty) {
      return { status: 'error', message: 'Admin not exist' };
    }
    if (password == null) {
      await adminDocRef.update({
        username: username,
        headAdmin: headAdmin
      });
    } else {
      await adminDocRef.update({
        username: username,
        password: password,
        headAdmin: headAdmin
      });
    }
    const IdDocRef = db.collection('Id').doc(uid);
    if (!IdDocRef.empty) {
      await IdDocRef.update({
        username: username
      });
    }
    return { status: 'success', message: 'Successfully edited admin account.' };
  }

    // 获取今天任务的完成情况
    static async getTodayTasks(adminId) {
      try {
        const adminRef = db.collection('Admin').doc(adminId);
        const adminDoc = await adminRef.get();
        if (!adminDoc.exists) throw new Error("Admin not found");
  
        const adminData = adminDoc.data();
        const tasksCompleted = adminData.tasksCompleted || 0; // 获取今日已完成任务数
        const dailyTasks = 20; // 每日任务目标
  
        return { success: true, tasksCompleted, dailyTasks };
      } catch (error) {
        console.error("Error fetching today's tasks:", error);
        return { success: false, message: error.message };
      }
    }
  
    // 获取待处理的报告队列
    static async getReportQueue() {
      try {
        const flaggedProducts = await ProductEntry.getFlaggedProducts();
        if (flaggedProducts.success) {
          return { success: true, queue: flaggedProducts.data };
        }
        return { success: false, message: "Failed to fetch report queue" };
      } catch (error) {
        console.error("Error fetching report queue:", error);
        return { success: false, message: error.message };
      }
    }

}

module.exports = Admin;