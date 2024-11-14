import React, { useEffect, useState } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './MessagePage.css';

const MessagePage = () => {
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [inputText, setInputText] = useState('');
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
        user1Id: userId,
      });
      if (response.data.success) {
        console.log(response.data.success);
        setConversations(response.data.data);
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

  const selectConversation = async (conversation) => {

  };
  const handleSend = async () => {

  };

  return (
    <div className="messagePage">
      {/* Back to HomePage Button */}
      <button className="backToHomePageButton" 
        onClick={() => navigate('/')}>Back to HomePage
      </button>

      {/* Left Side */}
      <div className="leftPanel">
        {/* Conversation List */}
        <h2 className="conversationListTitle">Conversation List</h2>
        <hr className="separator" />
        <div className="conversationList">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversationItem ${
                selectedConversationId === conversation.id ? 'active' : ''
              }`}
              onClick={() => setSelectedConversationId(conversation.id)}
            >
              <div className="conversationInfo">
                <h3>{conversation.user1 === userId ? conversation.user2 : conversation.user1}</h3>
                <p>{conversation.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
        <hr className="separator" />
        {/* Search User Area */}
        <div className="searchUserArea">
          <input
            type="text"
            placeholder="Search the User and follow!"
            className="searchInput"
          />
        </div>
      </div>
  
      {/* Right Side: Chat Window */}
      <div className="rightPanel">
        {selectedConversationId ? (
          <>
            {/* Message List */}
            <h2 className="followUserName">???</h2>
            <hr className="separator" />
            <div className="messageList">
              {/* Render messages dynamically here */}
            </div>
            <hr className="separator" />
            {/* Input Area */}
            <div className="inputArea">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send message here..."
                className="messageInput"
              />
              <button onClick={handleSend} className="sendButton">Send</button>
            </div>
          </>
        ) : (
          <div className="noConversationSelected">
            Choose one of the conversation and send the message!
          </div>
        )}
      </div>
    </div>
  );
  
};

export default MessagePage;
