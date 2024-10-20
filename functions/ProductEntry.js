const admin = require('firebase-admin');
const db = admin.firestore();
const Id = require('./Id');
const Parameter = require('./Parameter');


class ProductEntry {
  constructor(prodidNum, productName, uidNum, description) {
    this.id = prodidNum;
    this.productName = productName;
    this.creator = uidNum;
    this.description = description;
    this.productImage = ""; 
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
      oneStar : 0
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
      tagList: this.tagList,
      description: this.description,
      productImage: this.productImage,
      parametorList: this.parametorList,
      averageScore: this.averageScore,
      ratingDistribution: this.ratingDistribution,
      averageScore: this.averageScore,
      ratingDistribution: this.ratingDistribution,
      commentList: this.commentList,
      reportList: Object.fromEntries(this.reportList)
    });
  }
  static async saveProductEntry(productData) {
    const { productName, uidNum, tags, paramList, description, imageBase64, imageName } = productData;

    const generateId = new Id();
    const productIdResult = await generateId.generateId('productEntry', productName);
    const prodidNum = productIdResult.idNum;
    const newProductEntry = new ProductEntry(prodidNum, productName, uidNum, description);
    const parameterIds = [];

    // Handle parameter list generation
    if (paramList && paramList.length > 0) {
      for (let i = 0; i < paramList.length; i++) {
        const paramIdResult = await generateId.generateId('parameter', paramList[i]);
        const paramId = paramIdResult.idNum;
        const paramName = paramList[i];

        const parameter = new Parameter(paramId, prodidNum, paramName);
        await parameter.save();
        parameterIds.push(paramId);
      }
    }

    // Handle image upload
    if (imageBase64 && imageName) {
      const productImageUrl = await ProductEntry.uploadImage(prodidNum, imageBase64, imageName);
      newProductEntry.productImage = productImageUrl;
    }

    newProductEntry.parametorList = parameterIds;
    newProductEntry.tagList = tags;

    // Save product entry
    await newProductEntry.generateProductEntry();
    return { success: true, idNum: prodidNum, message: 'Product entry created successfully!' };
  }

  static async uploadImage(prodidNum, imageBase64, imageName) {
    const buffer = Buffer.from(imageBase64, 'base64');
    const productImageFilePath = `productImage/${prodidNum}/${imageName}`;
    const productImageFile = bucket.file(productImageFilePath);

    await productImageFile.save(buffer, {
      contentType: 'image/jpeg',
      public: true,
    });
    return productImageFile.publicUrl();
  }
}

module.exports = ProductEntry;