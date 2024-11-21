import React, { useEffect, createContext, useContext, useState } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import styles from './FollowModal.module.css';

const FollowModalContext = createContext();

export const useFollowModal = () => useContext(FollowModalContext);

const FollowModal = () => {
  const {
    isOpen,
    loginUserId,
    loginUserName,
    followUserId,
    followUserName,
    followingList,
    openModal,
    closeModal,
    updateFollowingList,
  } = useFollowModal();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (isOpen && followUserId) {
      setIsFollowing(followingList.includes(followUserId));
    }
  }, [isOpen, followUserId, followingList]);

  const updateFirestoreFollowingList = async (newList) => {
    const db = getFirestore();
    const userRef = doc(db, 'User', loginUserId);
    await updateDoc(userRef, { followingList: newList });
  };

  const handleFollow = async () => {
    if (!isFollowing) {
      const updatedList = [...followingList, followUserId];
      setIsFollowing(true);
      updateFollowingList(updatedList);
      await updateFirestoreFollowingList(updatedList);

      const generateConversation = httpsCallable(functions, 'handleConversationRequest');
      await generateConversation({
        action: 'generate',
        user1Id: loginUserId,
        user2Id: followUserId,
        user1Name: loginUserName,
        user2Name: followUserName,
        senderId: loginUserId,
      });
    }
  };

  const handleUnfollow = async () => {
    if (isFollowing) {
      const updatedList = followingList.filter((id) => id !== followUserId);
      setIsFollowing(false);
      updateFollowingList(updatedList);
      await updateFirestoreFollowingList(updatedList);
    }
  };

  return (
    <div className={`${styles.followModal} ${isOpen ? styles.visible : styles.hidden}`}>
      <div className={styles.followModalContent}>
        <h2>Username: <span>{followUserName}</span></h2>
        <div className={styles.buttonContainer}>
          {isFollowing ? (
            <button onClick={handleUnfollow} className={styles.followModalButton}>Unfollow</button>
          ) : (
            <button onClick={handleFollow} className={styles.followModalButton}>Follow</button>
          )}
          <button onClick={closeModal} className={styles.followModalButton}>Close</button>
        </div>
      </div>
</div>

  );
};

export const FollowModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loginUserId, setLoginUserId] = useState(null);
  const [loginUserName, setLoginUserName] = useState(null);
  const [followUserId, setFollowUserId] = useState(null);
  const [followUserName, setFollowUserName] = useState('');
  const [followingList, setFollowingList] = useState([]);

  useEffect(() => {
    const checkLoginStatusFetchData = async () => {
      try {
        const localStatusToken = localStorage.getItem('authToken');
        if (localStatusToken) {
          const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
          const response = await handleUserRequest({
            action: 'checkLoginStatus',
            statusToken: localStatusToken,
          });
  
          if (response.data.success) {
            setLoginUserId(response.data.uid);
            setLoginUserName(response.data.username);
            const db = getFirestore();
            const userRef = doc(db, 'User', response.data.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setFollowingList(userData.followingList || []);
            }
          } else {
            localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };
  
    checkLoginStatusFetchData();
  }, [isOpen, followingList]);

  const openModal = (id, name) => {
    setFollowUserId(id);
    setFollowUserName(name);
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setFollowUserId('');
    setFollowUserName('');
  };
  const updateFollowingList = (newList) => {
    setFollowingList(newList);
  };

  return (
    <FollowModalContext.Provider
      value={{
        isOpen,
        loginUserId,
        loginUserName,
        followUserId,
        followUserName,
        followingList,
        openModal,
        closeModal,
        updateFollowingList,
      }}
    >
      {children}
      <FollowModal />
    </FollowModalContext.Provider>
  );
};
