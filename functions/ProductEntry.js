const admin = require('firebase-admin');
const db = admin.firestore();

class ProductEntry {
  constructor(prodidNum, productName, uidNum) {
    this.id = prodidNum;
    this.productName = productName;
    this.creator = uidNum;
    this.tagList = new Array(5).fill(null);
    this.averageScore = {
      average: 0,
      totalScore: 0,
      totalRater: 0,
    };
    this.ratingDistribution = {
      fiveStars : 0,
      fourStars : 0,
      threeStars : 0,
      twoStars : 0,
      oneStars : 0
    }
    this.parametorList = new Array(10).fill(null);
    this.commentList = [];
    this.reportList = new Map();
  }

  async generateProductEntry() {
    const productDocRef = db.collection('ProductEntry').doc(this.id);
    await productDocRef.set({
      id: this.id,
      productName: this.productName,
      creator: this.creator,
      tags: this.tagList,
      parametorList: this.parametorList,
      averageScore: this.averageScore,
      ratingDistribution: this.ratingDistribution,
      commentList: this.commentList,
      reportList: Object.fromEntries(this.reportList)
    });
  }
}

module.exports = ProductEntry;