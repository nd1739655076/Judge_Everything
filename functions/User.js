const admin = require('firebase-admin');

const db = admin.firestore();

class User {
  constructor(uidNum, username, password, email) {
    this.id = uidNum;
    this.username = username;
    this.password = password;
    this.email = email;
    this.nickname = '';
    this.preferences = [null, null, null, null, null];
    this.productProfileCreateHistory = [];
    this.followingList = [];
    this.followers = [];
    this.conversationList = [];
    this.searchHistory = [];
    this.browseHistory = [];
    this.rateCommentHistory = [];
  }

  async generateUser() {
    const userDocRef = db.collection('User').doc(this.id);
    await userDocRef.set({
      id: this.id,
      username: this.username,
      password: this.password,
      email: this.email,
      nickname: null,
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
}

module.exports = User;