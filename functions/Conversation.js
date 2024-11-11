const admin = require('firebase-admin');

const db = admin.firestore();

class Conversation {
  // helper
  async generateConversationId() {
    const counterRef = db.collection('Counters').doc('conversationCounter');
    const counterDoc = await counterRef.get();
    let conversationCount = 0;
    if (counterDoc.exists) {
      conversationCount = counterDoc.data().count + 1;
    } else {
      conversationCount = 1;
    }
    await counterRef.set({ count: conversationCount });
    return `CON${conversationCount}`;
  }

  // action === 'generate'
  async generateConversation(user1Id, user2Id) {
    const conversationId = await this.generateConversationId();
    const conversationDocRef = db.collection('Conversations').doc(conversationId);
    await conversationDocRef.set({
      conversationId: conversationId,
      user1: user1Id,
      user2: user2Id,
      messageList: [],
      lastMessage: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Method to send a message and insert it into the conversation's messageList
  async sendMessage(conversationId, senderId, content) {
    const conversationDocRef = db.collection('Conversations').doc(conversationId);

    // Construct the message object
    const message = {
      sender: senderId,
      receiver: receiverId,
      content: content,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await conversationDocRef.update({
      messageList: admin.firestore.FieldValue.arrayUnion(message),
      lastMessage: admin.firestore.FieldValue.serverTimestamp(),
    });
    return message;
  }
}


module.exports = Conversation;