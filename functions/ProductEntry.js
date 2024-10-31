const admin = require('firebase-admin');
const db = admin.firestore();
const Id = require('./Id');
const Parameter = require('./Parameter');
const bucket = admin.storage().bucket('judge-everything.appspot.com');
const TagLibrary = require('./TagLibrary');

class ProductEntry {
  constructor(prodidNum, productName, uidNum, description, tags, subtags) {
    this.id = prodidNum;
    this.productName = productName;
    this.creator = uidNum;
    this.description = description;
    this.productImage = ""; 
    this.tagList = tags; // Storing the selected tags
    this.subtagList = subtags; // Storing the selected subtags
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
    };
    this.parametorList = new Array(10).fill(null);
    this.commentList = [];
    this.reportList = new Map();
  }

  static sanitizeData(data) {
    return isNaN(data) ? 0 : data;
  }

  async generateProductEntry() {
    const productDocRef = db.collection('ProductEntry').doc(this.id);
    await productDocRef.set({
      id: this.id,
      productName: this.productName,
      creator: this.creator,
      tagList: this.tagList, // Save the tags
      subtagList: this.subtagList, // Save the subtags
      description: this.description,
      productImage: this.productImage,
      parametorList: this.parametorList,
      averageScore: {
        average: ProductEntry.sanitizeData(this.averageScore.average),
        totalScore: ProductEntry.sanitizeData(this.averageScore.totalScore),
        totalRater: ProductEntry.sanitizeData(this.averageScore.totalRater),
      },
      ratingDistribution: {
        fiveStars: ProductEntry.sanitizeData(this.ratingDistribution.fiveStars),
        fourStars: ProductEntry.sanitizeData(this.ratingDistribution.fourStars),
        threeStars: ProductEntry.sanitizeData(this.ratingDistribution.threeStars),
        twoStars: ProductEntry.sanitizeData(this.ratingDistribution.twoStars),
        oneStars: ProductEntry.sanitizeData(this.ratingDistribution.oneStars),
      },
      commentList: this.commentList,
      reportList: Object.fromEntries(this.reportList)
    });
  }
  static async saveProductEntry(productData) {
    const { action, productName, uidNum, tag, subtags, paramList, description, imageBase64, imageName } = productData;

    const generateId = new Id();
    const productIdResult = await generateId.generateId('productEntry', productName);
    const prodidNum = productIdResult.idNum;
    const newProductEntry = new ProductEntry(prodidNum, productName, uidNum, description, tag, subtags);
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
    newProductEntry.tagList = tag;

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
  static async fetchProducts() {
    try {
      const productEntriesRef = db.collection("ProductEntry");
      const productSnapshot = await productEntriesRef.get();
      
      const productList = productSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...JSON.parse(JSON.stringify(data)) // Ensure JSON-serializable data
        };
      });
      
      return { success: true, data: productList };
    } catch (error) {
      console.error("Error fetching product list:", error);
      throw new Error("Failed to fetch product list");
    }
  }

  static async addCommentId(productId, commentId) {
    const productRef = db.collection("ProductEntry").doc(productId);
    await productRef.update({
      commentList: admin.firestore.FieldValue.arrayUnion(commentId)
    });
    return { success: true, message: "Comment ID added to ProductEntry." };
  }

  static async reportProduct(productId, reportReason, reporter) {
    const productRef = db.collection('ProductEntry').doc(productId);

    const reportData = {
      reportReason,
      reporter,
      flags: 1,
    };

    // 将举报信息添加到 reportList 中
    await productRef.update({
      [`reportList.${productId}`]: admin.firestore.FieldValue.arrayUnion(reportData),
    });

    return { success: true, message: "Product reported successfully." };
  }

  static async updateProductReportFlags(productId) {
    const productRef = db.collection('ProductEntry').doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) throw new Error("Product not found");

    const reportList = productSnap.data().reportList;
    if (!reportList[productId]) throw new Error("Report not found");

    // 更新举报的 flags 数量
    reportList[productId].flags += 1;
    
    await productRef.update({
      reportList,
    });

    return { success: true, message: "Report flags updated successfully." };
  }
  
}

module.exports = ProductEntry;