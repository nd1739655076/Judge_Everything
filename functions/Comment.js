const admin = require('firebase-admin');
const db = admin.firestore();

class Comment {
  constructor(commentId, title, content, averageRating, parameterRatings, user, productId) {
    this.commentId = commentId;
    this.title = title;
    this.content = content;
    this.averageRating = averageRating;
    this.parameterRatings = parameterRatings; // object containing ratings for each parameter
    this.user = user;
    this.timestamp = new Date().toISOString();
    this.productId = productId;
    this.likes = 0;
  }

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
      likes: this.likes
    });
  }
}

module.exports = Comment;
