const admin = require('firebase-admin');

const db = admin.firestore();

class ProductEntry {
  constructor(prodidNum, productName, uidNum) {
    this.id = prodidNum;
    this.productName = productName;
    this.creator = uidNum;
    this.tagList = new array(5);
    this.averageScore = null;
    this.parametorList = new array(10);
    this.commentList = [];
    this.reportList = new Map();
  }

  async generateProductEntry() {
    const productDocRef = db.collection('ProductEntry').doc(this.id);
    await productDocRef.set({
      id: this.id,
      productName: this.productName,
      creator: this.creator,
      tagList: this.tagList,
      averageScore: this.averageScore,
      parametorList: this.parametorList,
      commentList: this.commentList,
      reportList: Object.fromEntries(this.reportList)
    });
  }
}

module.exports = ProductEntry;