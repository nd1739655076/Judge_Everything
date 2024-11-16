const admin = require('firebase-admin');

const db = admin.firestore();

class Conversation {
  // helper
  static async generateConversationId() {
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
  static async generateConversation(user1Id, user2Id, user1Name, user2Name, senderId) {
    const existingConversationSnapshot = await db.collection('Conversations')
    .where('user1', 'in', [user1Id, user2Id])
    .where('user2', 'in', [user1Id, user2Id])
    .get();
    if (!existingConversationSnapshot.empty) {
    return;
    }
    const conversationId = await this.generateConversationId();
    const conversationDocRef = db.collection('Conversations').doc(conversationId);
    await conversationDocRef.set({
      conversationId: conversationId,
      user1: user1Id,
      user2: user2Id,
      user1Name: user1Name,
      user2Name: user2Name,
      messageList: [],
      lastMessage: Date.now(),
    });
    // Update both users' conversation lists
    const user1Ref = db.collection('User').doc(user1Id);
    const user2Ref = db.collection('User').doc(user2Id);
    await user1Ref.update({
      conversationList: admin.firestore.FieldValue.arrayUnion(conversationId),
    });
    await user2Ref.update({
      conversationList: admin.firestore.FieldValue.arrayUnion(conversationId),
    });
    await this.sendMessage(conversationId, senderId, 'Hi! I just followed you. Excited to chat!');
  }

  // action === 'fetchUserConversation'
  static async fetchUserConversation(loginUserId) {
    const userRef = db.collection('User').doc(loginUserId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return { success: false, message: 'User document does not exist.' };
    }
    const userData = userDoc.data();
    const conversationList = userData.conversationList || [];
    if (conversationList.length === 0) {
      return { success: true, message: 'No conversations found.', data: [] };
    }
    const conversations = [];
    for (const conversationId of conversationList) {
      const conversationRef = db.collection('Conversations').doc(conversationId);
      const conversationDoc = await conversationRef.get();
      if (conversationDoc.exists) {
        conversations.push({ id: conversationDoc.id, ...conversationDoc.data() });
      }
    }
    return { success: true, data: conversations };
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

  // action === 'sendMessage'
  static async sendMessage(conversationId, senderId, content) {
    const conversationDocRef = db.collection('Conversations').doc(conversationId);
    const message = {
      sender: senderId,
      content: content,
      timestamp: Date.now(),
    };
    await conversationDocRef.update({
      messageList: admin.firestore.FieldValue.arrayUnion(message),
      lastMessage: Date.now(),
    });
  }
}


module.exports = Conversation;