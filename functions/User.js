const admin = require('firebase-admin');

const db = admin.firestore();

class User {
  constructor(uidNum, username, password, email) {
    this.id = uidNum;
    this.username = username;
    this.password = password;
    this.email = email;
    this.nickname = '';
    this.preferences = new Array(5);
    this.productProfileCreateHistory = [];
    this.followingList = [];
    this.followers = [];
    this.conversationList = [];
    this.searchHistory = [];
    this.browseHistory = [];
    this.rateCommentHistory = [];
  }

  async generateUser() {
    const userDocRef = db.collection('User').doc(this.id.idNum);
    await userDocRef.set({
      id: this.id,
      username: this.username,
      password: this.password,
      email: this.email,
      nickname: this.nickname,
      preferences: this.preferences,
      productProfileCreateHistory: this.productProfileCreateHistory,
      followingList: this.followingList,
      followers: this.followers,
      conversationList: this.conversationList,
      searchHistory: this.searchHistory,
      browseHistory: this.browseHistory,
      rateCommentHistory: this.rateCommentHistory,
    });
  }
}

module.exports = User;