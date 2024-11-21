import React, { useEffect, useState } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import styles from './MessagePage.module.css';

import { useNavigate } from 'react-router-dom';
import { useFollowModal } from '../FollowModal/FollowModal';

const MessagePage = () => {
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const { openModal } = useFollowModal();
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const localStatusToken = localStorage.getItem('authToken');
      if (localStatusToken) {
        const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
        const response = await handleUserRequest({
          action: 'checkLoginStatus',
          statusToken: localStatusToken,
        });
        if (response.data.success) {
          setUserId(response.data.uid);
          setUsername(response.data.username);
        } else {
          localStorage.removeItem('authToken');
        }
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchConversations = async () => {
      const fetchUserConversation = httpsCallable(functions, 'handleConversationRequest');
      const response = await fetchUserConversation({
        action: 'fetchUserConversation',
        loginUserId: userId,
      });
      if (response.data.success) {
        if (response.data.data && response.data.data.length > 0) {
          const formattedConversations = response.data.data.map((conversation) => {
            // Format lastMessage using Date.now() format
            if (conversation.lastMessage && typeof conversation.lastMessage === 'number') {
              conversation.lastMessage = new Date(conversation.lastMessage).toLocaleString();
            }
            // Format messageList timestamps
            if (Array.isArray(conversation.messageList)) {
              conversation.messageList = conversation.messageList.map((message) => {
                if (message.timestamp && typeof message.timestamp === 'number') {
                  message.timestamp = new Date(message.timestamp).toLocaleString();
                }
                return message;
              });
            }
            return conversation;
          });
          console.log("Fetched conversations from Cloud Function:", response.data.data);
          setConversations(formattedConversations);
        } else {
          console.log(response.data.message);
          setConversations([]);
        }
      } else {
        console.error(response.data.message || "Failed to fetch conversations.");
      }
    };
    fetchConversations();

    const db = getFirestore();
    const userRef = doc(db, 'User', userId);
    // Set up a listener for the user's conversation list
    const conversationListListener = onSnapshot(userRef, (userSnapshot) => {
      if (!userSnapshot.exists()) {
        console.error("User document does not exist!");
        return;
      }
      const userData = userSnapshot.data();
      const conversationList = userData.conversationList || [];

      // Fetch and listen for changes in each conversation
      const conversationsListeners = [];
      conversationList.forEach((conversationId) => {
        const conversationRef = doc(db, 'Conversations', conversationId);
        const conversationListener = onSnapshot(conversationRef, (conversationSnapshot) => {
          if (conversationSnapshot.exists()) {
            const conversationData = {
              id: conversationSnapshot.id,
              ...conversationSnapshot.data(),
            };
            // Format lastMessage using Date.now() format
            if (conversationData.lastMessage && typeof conversationData.lastMessage === 'number') {
              conversationData.lastMessage = new Date(conversationData.lastMessage).toLocaleString();
            }
            // Format messageList timestamps
            if (Array.isArray(conversationData.messageList)) {
              conversationData.messageList = conversationData.messageList.map((message) => {
                if (message.timestamp && typeof message.timestamp === 'number') {
                  message.timestamp = new Date(message.timestamp).toLocaleString();
                }
                return message;
              });
            }
            setConversations((prevConversations) => {
              const index = prevConversations.findIndex((conv) => conv.id === conversationId);
              if (index !== -1) {
                // Update existing conversation
                const updatedConversations = [...prevConversations];
                updatedConversations[index] = conversationData;
                return updatedConversations;
              } else {
                // Add new conversation
                return [...prevConversations, conversationData];
              }
            });
          }
        });
        conversationsListeners.push(conversationListener);
      });

      // Cleanup function to detach all listeners when the component unmounts
      return () => {
        conversationsListeners.forEach((unsubscribe) => unsubscribe());
      };
    });

    // Cleanup the user listener when the component unmounts
    return () => conversationListListener();
  }, [userId]);

  useEffect(() => {
    const conversation = conversations.find(
      (conv) => conv.id === selectedConversationId
    );
    if (conversation) {
      // Format lastMessage using Date.now() format
      if (conversation.lastMessage && typeof conversation.lastMessage === 'number') {
        conversation.lastMessage = new Date(conversation.lastMessage).toLocaleString();
      }
      // Format messageList timestamps
      if (Array.isArray(conversation.messageList)) {
        conversation.messageList = conversation.messageList.map((message) => {
          if (message.timestamp && typeof message.timestamp === 'number') {
            message.timestamp = new Date(message.timestamp).toLocaleString();
          }
          return message;
        });
      }
    }
    setSelectedConversation(conversation || null);

    if (selectedConversationId && userId) {
      const setAllRead = httpsCallable(functions, 'handleConversationRequest');
      setAllRead({
        action: 'setAllRead',
        conversationId: selectedConversationId,
        senderId: userId,
      });
    }
  }, [selectedConversationId, conversations]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedConversationId || !userId) return;
    const sendMessage = httpsCallable(functions, 'handleConversationRequest');
    await sendMessage({
      action: 'sendMessage',
      conversationId: selectedConversationId,
      senderId: userId,
      content: inputText.trim(),
    });
    setInputText('');
  };
  const handleSearch = async () => {
    if (!searchQuery) return;
    const searchUsers = httpsCallable(functions, 'handleConversationRequest');
    const response = await searchUsers({
      action: 'searchUsersByUsername',
      searchString: searchQuery,
    });
    if (response.data.success) {
      setSearchResults(response.data.data);
    }
  };
  const handleSearchResultClick = (userId, username) => {
    openModal(userId, username);
  };

  return (
    <div className={styles.messagePage}>
      {/* Back to HomePage Button */}
      <button className={styles.backToHomePageButton} onClick={() => navigate('/')}>
        Back to HomePage
      </button>

      {/* Left Side */}
      <div className={styles.leftPanel}>
        {/* Conversation List Area */}
        <h2 className={styles.conversationListTitle}>Conversation List</h2>
        <hr className={styles.separator} />
        <div className={styles.conversationList}>
        {[...conversations]
          .sort((a, b) => {
            const timeA = new Date(a.lastMessage).getTime();
            const timeB = new Date(b.lastMessage).getTime();
            return timeB - timeA;
          })
          .map((conversation) => {
            let unreadMessageCount = 0;
            if (conversation.user1 === userId) {
              unreadMessageCount = conversation.user1UnreadMessageCount || 0;
            } else if (conversation.user2 === userId) {
              unreadMessageCount = conversation.user2UnreadMessageCount || 0;
            }

            return (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${
                  selectedConversationId === conversation.id ? styles.active : ''
                }`}
                onClick={() => setSelectedConversationId(conversation.id)}
              >
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationName}>
                    {conversation.user1 === userId ? conversation.user2Name : conversation.user1Name}
                  </div>
                  <div className={styles.conversationDate}>{conversation.lastMessage}</div>
                </div>
                {unreadMessageCount > 0 && (
                  <span className={styles.unreadMessageBadge}>{unreadMessageCount}</span>
                )}
              </div>
            );
          })}
        </div>
        <hr className={styles.separator} />
        {/* Search User Area */}
        <div className={styles.searchUserArea}>
          <input
            type="text"
            placeholder="Search the User and follow!"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={handleSearch} className={styles.searchButton}>
            Search
          </button>
          <div className={styles.searchResults}>
            {searchResults.map((user) => (
              <div
                key={user.userId}
                className={styles.searchResultItem}
                onClick={() => handleSearchResultClick(user.userId, user.username)}
              >
                <p>{user.username}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Chat Window */}
      <div className={styles.rightPanel}>
        {selectedConversation ? (
          <>
            <h2 className={styles.followUserName}>
              {selectedConversation.user1 === userId
                ? selectedConversation.user2Name
                : selectedConversation.user1Name}
            </h2>
            <hr className={styles.separator} />
            <div className={styles.messageList}>
              {selectedConversation &&
                selectedConversation.messageList.map((message, index) => (
                  <div
                    key={index}
                    className={
                      message.sender === userId
                        ? `${styles.message} ${styles.rightMessage}`
                        : `${styles.message} ${styles.leftMessage}`
                    }
                  >
                    <div className={styles.messageContent}>{message.content}</div>
                    <div className={styles.messageTimestamp}>
                      {message.timestamp
                        ? new Date(message.timestamp).toLocaleString()
                        : ""}
                    </div>
                  </div>
                ))}
            </div>
            <hr className={styles.separator} />
            <div className={styles.inputArea}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send message here..."
                className={styles.messageTextarea}
              />
              <button onClick={handleSend} className={styles.sendButton}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noConversationSelected}>
            Choose one of the conversations and send a message!
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagePage;
