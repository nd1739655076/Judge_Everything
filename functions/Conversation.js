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
  static async generateConversation(user1Id, user2Id) {
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

  // action === 'fetchUserConversation'
  static async fetchUserConversation(user1Id) {
    const userRef = db.collection('User').doc(user1Id);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const conversationList = userData.conversationList || [];
    const conversations = [];
    if (conversationList.length === 0) {
      return conversations;
    }
    for (const conversationId of conversationList) {
      const conversationRef = db.collection('Conversations').doc(conversationId);
      const conversationDoc = await conversationRef.get();
      if (conversationDoc.exists) {
        conversations.push({ id: conversationDoc.id, ...conversationDoc.data() });
      }
    }
    return conversations;
  }

  // action === 'searchUsersByUsername'
  static async searchUsersByUsername(searchString) {
    const usersRef = db.collection('User');
    const snapshot = await usersRef
      .where('username', '>=', searchString)
      .where('username', '<=', searchString + '\uf8ff')
      .get();
    if (snapshot.empty) {
      return [];
    }
    const users = [];
    snapshot.forEach(doc => {
      users.push({ userId: doc.id, username: doc.data().username });
    });
    return users;
  }

  // Method to send a message and insert it into the conversation's messageList
  static async sendMessage(conversationId, senderId, content) {
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