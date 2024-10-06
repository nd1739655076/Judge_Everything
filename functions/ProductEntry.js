const admin = require('firebase-admin');
const db = admin.firestore();

class ProductEntry {
  constructor(prodidNum, productName, uidNum) {
    this.id = prodidNum;
    this.productName = productName;
    this.creator = uidNum;
    this.tagList = new Array(5).fill(null); // Initialize with empty values
    this.averageScore = {
      average: 0,
      totalScore: 0,
      totalRater: 0,
    };
    this.parametorList = new Array(10).fill(null); // Initialize with empty values
    this.commentList = [];
    this.reportList = new Map(); // Will be converted to object when saving
  }

  async generateProductEntry() {
    const productDocRef = db.collection('ProductEntry').doc(this.id);
    
    // Convert reportList from Map to a regular object
    await productDocRef.set({
      id: this.id,
      productName: this.productName,
      creator: this.creator,
      tagList: this.tagList,
      averageScore: this.averageScore,
      parametorList: this.parametorList,
      commentList: this.commentList,
      reportList: Object.fromEntries(this.reportList) // Convert Map to object
    });
  }
}

module.exports = ProductEntry;