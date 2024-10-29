const admin = require('firebase-admin');
const db = admin.firestore();

class Comment {
  constructor(commentId, title, content, averageRating, parameterRatings, user, productId) {
    this.commentId = commentId;
    this.title = title;
    this.content = content;
    this.averageRating = averageRating;
    this.parameterRatings = parameterRatings;
    this.user = user;
    this.timestamp = new Date().toISOString();
    this.productId = productId;
    this.likes = [];
    this.dislikes = [];
    this.likeAmount = 0;
    this.dislikeAmount = 0;
  }

  // 创建并存储新评论
  async generateComment() {
    const commentDocRef = db.collection('ProductEntry').doc(this.productId).collection('Comments').doc(this.commentId);

    await commentDocRef.set({
      commentId: this.commentId,
      title: this.title,
      content: this.content,
      averageRating: this.averageRating,
      parameterRatings: this.parameterRatings,
      user: this.user,
      timestamp: this.timestamp,
      likes: this.likes,
      dislikes: this.dislikes,
      likeAmount: this.likeAmount,
      dislikeAmount: this.dislikeAmount,
    });
  }

  // 处理点赞或反对逻辑
  static async handleLikeDislike({ commentId, productId, uid, isLike }) {
    const productRef = db.collection('ProductEntry').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      throw new Error('Product not found');
    }

    // 检查 `commentList` 中是否包含指定 `commentId` 的评论
    const commentIndex = productDoc.data().commentList.findIndex(comment => comment.commentId === commentId);
    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    let comment = productDoc.data().commentList[commentIndex];
    let newLikes = [...(comment.likes || [])];
    let newDislikes = [...(comment.dislikes || [])];

    // 更新点赞或反对状态
    if (isLike) {
      if (newLikes.includes(uid)) {
        newLikes = newLikes.filter(id => id !== uid); // 移除点赞
      } else {
        newLikes.push(uid); // 添加点赞
        newDislikes = newDislikes.filter(id => id !== uid); // 移除反对
      }
    } else {
      if (newDislikes.includes(uid)) {
        newDislikes = newDislikes.filter(id => id !== uid); // 移除反对
      } else {
        newDislikes.push(uid); // 添加反对
        newLikes = newLikes.filter(id => id !== uid); // 移除点赞
      }
    }

    // 更新评论中的 likes 和 dislikes
    comment.likes = newLikes;
    comment.dislikes = newDislikes;
    comment.likeAmount = newLikes.length;
    comment.dislikeAmount = newDislikes.length;

    // 更新数据库中的 `commentList`
    productDoc.data().commentList[commentIndex] = comment;
    await productRef.update({ commentList: productDoc.data().commentList });

    return { success: true };
  }
}

module.exports = Comment;