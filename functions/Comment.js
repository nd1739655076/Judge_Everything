const admin = require('firebase-admin');
const db = admin.firestore();
const Id = require('./Id');  // 用于生成唯一 ID

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
    this.replies = [];  // 新增字段用于存储回复的 commentId 列表
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
      replies: this.replies
    });
  }

  // 添加新回复
  static async addReply({ commentId, content, user, productId, parentCommentId }) {
    const replyId = new Id().generateId('reply', content); // 生成回复的唯一 ID
    const replyDocRef = db.collection('ProductEntry').doc(productId)
                          .collection('Comments').doc(parentCommentId)
                          .collection('Replies').doc(replyId);

    const replyData = {
      commentId: replyId,
      parentCommentId,
      content,
      user,
      timestamp: new Date().toISOString(),
      likes: [],
      dislikes: [],
      likeAmount: 0,
      dislikeAmount: 0
    };

    // 存储新回复到数据库
    await replyDocRef.set(replyData);

    // 将新回复的 commentId 添加到主评论的 replies 列表中
    const parentCommentRef = db.collection('ProductEntry').doc(productId)
                               .collection('Comments').doc(parentCommentId);
    await parentCommentRef.update({
      replies: admin.firestore.FieldValue.arrayUnion(replyId)
    });
  }

  // 获取按点赞数排序的部分回复
  static async getTopReplies({ commentId, productId, limit = 3 }) {
    const repliesRef = db.collection('ProductEntry').doc(productId)
                         .collection('Comments').doc(commentId)
                         .collection('Replies');
    
    const querySnapshot = await repliesRef.orderBy('likeAmount', 'desc').limit(limit).get();
    const topReplies = [];
    querySnapshot.forEach(doc => {
      topReplies.push({ ...doc.data(), commentId: doc.id });
    });
    return topReplies;
  }

  // 处理点赞或反对逻辑
  static async handleLikeDislike({ commentId, productId, uid, isLike }) {
    const commentRef = db.collection('ProductEntry').doc(productId)
                         .collection('Comments').doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) throw new Error('Comment not found');

    const commentData = commentDoc.data();
    let newLikes = [...(commentData.likes || [])];
    let newDislikes = [...(commentData.dislikes || [])];

    if (isLike) {
      if (newLikes.includes(uid)) {
        newLikes = newLikes.filter(id => id !== uid); // 取消点赞
      } else {
        newLikes.push(uid); // 添加点赞
        newDislikes = newDislikes.filter(id => id !== uid); // 取消反对
      }
    } else {
      if (newDislikes.includes(uid)) {
        newDislikes = newDislikes.filter(id => id !== uid); // 取消反对
      } else {
        newDislikes.push(uid); // 添加反对
        newLikes = newLikes.filter(id => id !== uid); // 取消点赞
      }
    }

    // 更新评论中的 likes 和 dislikes
    await commentRef.update({
      likes: newLikes,
      dislikes: newDislikes,
      likeAmount: newLikes.length,
      dislikeAmount: newDislikes.length
    });
  }
}

module.exports = Comment;
