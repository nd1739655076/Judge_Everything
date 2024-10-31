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
  // Id 生成方法不变，继续使用 'comment' 类型
  static async addReply({ content, user, productId, parentCommentId }) {
    const generateId = new Id();
    const replyIdResult = await generateId.generateId('comment', content);
    const replyId = replyIdResult.idNum;

    // 检查生成的 ID 是否为空
    if (!replyId) {
        console.error("Generated replyId is invalid:", replyId);
        throw new Error("Generated replyId is invalid");
    }
    // 确定是否为主评论
    const parentReplies = !parentCommentId;

    const replyData = {
        commentId: replyId,
        content,
        user: { uid: user.uid, username: user.username },
        timestamp: new Date().toISOString(),
        likes: [],
        dislikes: [],
        likeAmount: 0,
        dislikeAmount: 0,
        parentCommentId: parentCommentId || null, // 如果是主评论，parentCommentId为空
        productId: productId, // 添加对应的 productId
        parentReplies
    };

    // 打印准备存储的回复数据
    console.log("Reply data to be saved:", replyData);

    // 存储新评论到 `Comments` 集合
    const commentRef = db.collection('Comments').doc(replyId);
    await commentRef.set(replyData);
    console.log(`Reply saved with ID: ${replyId}`);

    // 更新父评论的 `replies` 字段
    if (parentCommentId) {
        console.log("Updating parent comment replies, parentCommentId:", parentCommentId);
        const parentCommentRef = db.collection('Comments').doc(parentCommentId);

        // 检查父评论是否有正确的路径
        if (!parentCommentId) {
            console.error("parentCommentId is invalid:", parentCommentId);
            throw new Error("parentCommentId is invalid");
        }

        await parentCommentRef.update({
            replies: admin.firestore.FieldValue.arrayUnion({
                numbers: [replyId, parentCommentId],
                content: content,
                user: { uid: user.uid, username: user.username }
            })
        });
        console.log(`Updated parent comment ${parentCommentId} with new reply ID: ${replyId}`);
    }

    console.log(`Reply added with ID: ${replyId}, for product ID: ${productId}`);
}


static async getTopReplies({ commentId, limit = 3, startAfter = null }) {
  const commentRef = db.collection('Comments').doc(commentId);
  const commentSnap = await commentRef.get();

  if (!commentSnap.exists) {
      console.error(`Comment with ID ${commentId} does not exist.`);
      return [];
  }

  const repliesCollection = commentRef.collection('Replies');
  let query = repliesCollection.orderBy('timestamp', 'asc').limit(limit);

  // If we have a startAfter document, start after it for pagination
  if (startAfter) {
      const startDoc = await repliesCollection.doc(startAfter).get();
      if (startDoc.exists) {
          query = query.startAfter(startDoc);
      }
  }

  const repliesSnap = await query.get();
  const replies = [];
  repliesSnap.forEach((doc) => {
      replies.push({ ...doc.data(), commentId: doc.id });
  });

  return replies;
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