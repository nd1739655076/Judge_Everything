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
    this.createdAt = admin.firestore.FieldValue.serverTimestamp();
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
    this.flag = 0;
    this.flaggedTime = admin.firestore.FieldValue.serverTimestamp();
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
      createdAt: this.createdAt,
      reportList: Object.fromEntries(this.reportList),
      flag: this.flag,
      flaggedTime: this.flaggedTime
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
    // Save product id to user history
    try {
    const userRef = db.collection("User").doc(uidNum);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error('Invalid user');
    const userData = userDoc.data();
    const currentHistory = userData.productProfileCreateHistory || [];
    const updatedHistory = [prodidNum, ...currentHistory];
    await userRef.update({
      productProfileCreateHistory: updatedHistory
    });
    } catch (error) {
      console.error("error recording history:", error);
      return { success: false, message: `Saving product to history failed: ${error}` };
    }
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
    try {
      const productRef = db.collection('ProductEntry').doc(productId);
      const productSnap = await productRef.get();
  
      if (!productSnap.exists) throw new Error("Product not found");
  
      const productData = productSnap.data();
      const reportData = {
        reportReason,
        reporter,
      };
  
      // Update reportList by adding the new report
      await productRef.update({
        reportList: admin.firestore.FieldValue.arrayUnion(reportData),
      });
  
      // Check if the number of reports is significant compared to the number of comments
      const reportCount = (productData.reportList || []).length + 1; // +1 for the new report
      const commentCount = productData.commentList.length;
  
      // If the report count is at least half of the comment count, flag the product
      if (reportCount >= Math.ceil(commentCount / 2)) {
        await productRef.update({
          flag: 1,
          flaggedTime: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
  
      return { success: true, message: "Product reported successfully." };
    } catch (error) {
      console.error("Error reporting product:", error);
      return { success: false, message: `Failed to report product: ${error.message}` };
    }
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

  static async getRelatedProducts(productId) {
    try {
        console.log(`Fetching related products for productId: ${productId}`);
        const productRef = db.collection('ProductEntry').doc(productId);
        const productSnap = await productRef.get();

        if (!productSnap.exists) {
            console.error('Product not found in Firestore');
            throw new Error('Product not found');
        }

        const { tagList = [], subtagList = [] } = productSnap.data(); // Use default empty arrays
        console.log('Tag list:', tagList, 'Subtag list:', subtagList);

        const productEntriesRef = db.collection('ProductEntry');
        const querySnapshot = await productEntriesRef.get();
        const relatedProducts = [];

        querySnapshot.forEach(doc => {
            const otherProduct = doc.data();
            if (doc.id !== productId) {
                const otherTagList = Array.isArray(otherProduct.tagList) ? otherProduct.tagList : [];
                const otherSubtagList = Array.isArray(otherProduct.subtagList) ? otherProduct.subtagList : [];

                const tagMatch = otherTagList.some(tag => tagList.includes(tag));
                const subtagMatch = otherSubtagList.some(subtag => subtagList.includes(subtag));

                let relevanceScore = 0;
                if (tagMatch) relevanceScore += 2;
                if (subtagMatch) relevanceScore += 1;

                // Sanitize numerical values to ensure they're not NaN
                relevanceScore = isNaN(relevanceScore) ? 0 : relevanceScore;
                otherProduct.averageScore = {
                    average: isNaN(otherProduct.averageScore?.average) ? 0 : otherProduct.averageScore.average,
                    totalScore: isNaN(otherProduct.averageScore?.totalScore) ? 0 : otherProduct.averageScore.totalScore,
                    totalRater: isNaN(otherProduct.averageScore?.totalRater) ? 0 : otherProduct.averageScore.totalRater,
                };
                otherProduct.ratingDistribution = {
                    fiveStars: isNaN(otherProduct.ratingDistribution?.fiveStars) ? 0 : otherProduct.ratingDistribution.fiveStars,
                    fourStars: isNaN(otherProduct.ratingDistribution?.fourStars) ? 0 : otherProduct.ratingDistribution.fourStars,
                    threeStars: isNaN(otherProduct.ratingDistribution?.threeStars) ? 0 : otherProduct.ratingDistribution.threeStars,
                    twoStars: isNaN(otherProduct.ratingDistribution?.twoStars) ? 0 : otherProduct.ratingDistribution.twoStars,
                    oneStars: isNaN(otherProduct.ratingDistribution?.oneStars) ? 0 : otherProduct.ratingDistribution.oneStars,
                };

                if (relevanceScore > 0) {
                    relatedProducts.push({
                        id: doc.id,
                        ...otherProduct,
                        relevanceScore
                    });
                }
            }
        });

        console.log('Related products fetched successfully:', relatedProducts);
        return { success: true, relatedProducts };
    } catch (error) {
        console.error("Error in getRelatedProducts:", error);
        throw new Error("Failed to fetch related products");
    }
}

static async getFlaggedProducts() {
  try {
    const flaggedProductsRef = db.collection('ProductEntry').where('flag', '==', 1);
    const flaggedProductsSnapshot = await flaggedProductsRef.get();

    if (flaggedProductsSnapshot.empty) {
      return { success: true, data: [] }; // 如果没有产品被标记，返回空数组
    }

    const flaggedProducts = flaggedProductsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: flaggedProducts };
  } catch (error) {
    console.error("Error fetching flagged products:", error);
    return { success: false, message: "Failed to fetch flagged products" };
  }
}

// 更新产品信息
static async updateProduct(productId, updates) {
  try {
    const productRef = db.collection("ProductEntry").doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      throw new Error("Product not found");
    }

    // 进行产品字段更新
    await productRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), // 记录更新时间
    });

    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, message: `Failed to update product: ${error.message}` };
  }
}

// 删除评论
static async deleteComment(productId, commentId) {
  try {
    // 删除评论文档
    const commentRef = db.collection("Comments").doc(commentId);
    const commentSnap = await commentRef.get();

    if (!commentSnap.exists) {
      throw new Error("Comment not found");
    }

    await commentRef.delete();

    // 从产品的评论列表中移除该评论
    const productRef = db.collection("ProductEntry").doc(productId);
    await productRef.update({
      commentList: admin.firestore.FieldValue.arrayRemove(commentId),
    });

    return { success: true, message: "Comment deleted successfully" };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, message: `Failed to delete comment: ${error.message}` };
  }
}

static async deleteParameter(productId, parameterId) {
  try {
    const productRef = db.collection('ProductEntry').doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      throw new Error('Product not found');
    }

    const productData = productSnap.data();
    const updatedParameterList = productData.parametorList.filter(id => id !== parameterId);

    // Update the product entry in the database
    await productRef.update({ parametorList: updatedParameterList });

    return { success: true, message: 'Parameter deleted successfully' };
  } catch (error) {
    console.error('Error deleting parameter:', error);
    throw new Error('Failed to delete parameter');
  }
}

static async addParameter(productId, parameterName) {
  try {
    const generateId = new Id();
    const paramIdResult = await generateId.generateId('parameter', parameterName);
    const newParameterId = paramIdResult.idNum;

    const productRef = db.collection('ProductEntry').doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      throw new Error('Product not found');
    }

    const productData = productSnap.data();
    const updatedParameterList = [...(productData.parametorList || []), newParameterId];

    // Update the product entry in the database
    await productRef.update({ parametorList: updatedParameterList });

    // Optionally, create a new Parameter document in the database
    const newParameter = new Parameter(newParameterId, productId, parameterName);
    await newParameter.save();

    return { success: true, message: 'Parameter added successfully', parameterId: newParameterId };
  } catch (error) {
    console.error('Error adding parameter:', error);
    throw new Error('Failed to add parameter');
  }
}



  
}

module.exports = ProductEntry;