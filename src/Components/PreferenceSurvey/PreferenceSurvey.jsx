import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import './PreferenceSurvey.css';  // Custom CSS for styling
import { httpsCallable } from 'firebase/functions'; // Ensure firebase is properly imported
import { functions } from '../../firebase'; // Your firebase configuration
import { useNavigate } from 'react-router-dom';  // 导入 useNavigate

Modal.setAppElement('#root');  // Set the app root element for accessibility

const PreferenceSurvey = ({ isOpen, onRequestClose, onSubmitSurvey }) => {
  const navigate = useNavigate();
  const [currentUsername, setCurrentUsername] = useState("");  // state to store the username
  const [currentPage, setCurrentPage] = useState(1);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [ageRange, setAgeRange] = useState(null);
  const [gender, setGender] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Fetch username from Firebase using the authToken
  useEffect(() => {
    const fetchUsername = async () => {
      const localStatusToken = localStorage.getItem('authToken');
      if (localStatusToken) {
        const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
        try {
          const response = await handleUserRequest({
            action: 'checkLoginStatus',
            statusToken: localStatusToken,
          });
          if (response.data.success) {
            setCurrentUsername(response.data.username);  // set the username here
          } else {
            console.error('Failed to fetch username:', response.data.message);
          }
        } catch (error) {
          console.error('Error fetching username:', error);
        }
      }
    };

    fetchUsername();
  }, []);

  // Fetch tags from the backend
  useEffect(() => {
    const fetchTags = async () => {
      const handleTagRequest = httpsCallable(functions, 'handleTagLibraryRequest');
      try {
        const response = await handleTagRequest({ action: 'getTagLibrary' });
        console.log("Tag data fetched:", response.data.tagList);  // 调试日志
        if (response.data.success) {
          setAvailableTags(response.data.tagList);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, []);

  const handleNext = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handleTagSelection = (tagName) => {
    setSelectedTags((prevTags) => {
      if (prevTags.includes(tagName)) {
        console.log("Tag deselected:", tagName);
        return prevTags.filter(tag => tag !== tagName);  // Deselect if already selected
      } else if (prevTags.length < 5) {
        console.log("Tag selected:", tagName);
        return [...prevTags, tagName];  // Select up to 5 tags
      }
      return prevTags;
    });
  };
  
  const handleFinish = async () => {
    const handleUserPreferences = httpsCallable(functions, 'handleUserPreferences');
    try {
      const response = await handleUserPreferences({
        username: currentUsername,  // Use the fetched username here
        gender, 
        ageRange, 
        selectedTags
      });
  
      if (response.data.success) {
        console.log('Preferences saved successfully:', response.data.message);
        navigate('/');
      } else {
        console.error('Error saving preferences:', response.data.message);
      }
    } catch (error) {
      console.error('Error sending preferences:', error);
    }
  };

  return (
    <Modal
      isOpen= {true}
      onRequestClose={onRequestClose}
      className="preference-survey-modal"
      overlayClassName="preference-survey-overlay"
    >
      {/* Page 1: Consent */}
      {currentPage === 1 && (
        <div className="survey-page">
          <h2>WELCOME TO JUDGE EVERYTHING!</h2>
          <p>Before we start the judging trip, please answer a few questions so we can get to know you better.</p>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="dataConsent"
              checked={isCheckboxChecked}
              onChange={() => setIsCheckboxChecked(!isCheckboxChecked)}
            />
            <label htmlFor="dataConsent">
              We will not use your data for this survey to do anything other than make personalized recommendations.
            </label>
          </div>
          <button
            className="survey-button"
            disabled={!isCheckboxChecked}
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      )}

      {/* Page 2: Age Selection */}
      {currentPage === 2 && (
        <div className="survey-page">
          <h2>What's your age?</h2>
          <div className="age-buttons">
            <button
              className={`survey-button ${ageRange === 'under18' ? 'selected' : ''}`}
              onClick={() => setAgeRange('under18')}
            >
              Under 18
            </button>
            <button
              className={`survey-button ${ageRange === '18-25' ? 'selected' : ''}`}
              onClick={() => setAgeRange('18-25')}
            >
              18-25
            </button>
            <button
              className={`survey-button ${ageRange === '26-35' ? 'selected' : ''}`}
              onClick={() => setAgeRange('26-35')}
            >
              26-35
            </button>
            <button
              className={`survey-button ${ageRange === '36-45' ? 'selected' : ''}`}
              onClick={() => setAgeRange('36-45')}
            >
              36-45
            </button>
            <button
              className={`survey-button ${ageRange === '46-55' ? 'selected' : ''}`}
              onClick={() => setAgeRange('46-55')}
            >
              46-55
            </button>
            <button
              className={`survey-button ${ageRange === '55+' ? 'selected' : ''}`}
              onClick={() => setAgeRange('55+')}
            >
              55+
            </button>
          </div>
          <button
            className="survey-button"
            disabled={!ageRange}
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      )}

      {/* Page 3: Gender Selection */}
      {currentPage === 3 && (
        <div className="survey-page">
          <h2>What's your gender?</h2>
          <div className="gender-buttons">
            <button
              className={`survey-button ${gender === 'male' ? 'selected' : ''}`}
              onClick={() => setGender('male')}
            >
              Male
            </button>
            <button
              className={`survey-button ${gender === 'female' ? 'selected' : ''}`}
              onClick={() => setGender('female')}
            >
              Female
            </button>
            <button
              className={`survey-button ${gender === 'others' ? 'selected' : ''}`}
              onClick={() => setGender('others')}
            >
              Others
            </button>
            <button
              className={`survey-button ${gender === 'preferNotToSay' ? 'selected' : ''}`}
              onClick={() => setGender('preferNotToSay')}
            >
              Prefer not to say
            </button>
          </div>
          <button
            className="survey-button"
            disabled={!gender}
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      )}

      {/* Page 4: Tag Selection */}
      {currentPage === 4 && (
        <div className="survey-page">
          <h2>Please Choose 1-5 tags that you are interested in:</h2>
          <div className="tag-buttons">
            {availableTags.length > 0 ? (
              availableTags.map((tag, index) => (
                <button
                  key={index}
                  className={`survey-button ${selectedTags.includes(tag.tagName) ? 'selected' : ''}`}
                  onClick={() => handleTagSelection(tag.tagName)}
                >
                  {tag.tagName}
                </button>
              ))
            ) : (
              <p>Loading tags...</p>
            )}
          </div>
          <p>You have selected {selectedTags.length} tags.</p>
          <button
            className="survey-button"
            disabled={selectedTags.length === 0 || selectedTags.length > 5}
            onClick={handleFinish}
          >
            Finish
          </button>
        </div>
      )}
    </Modal>
  );
};

export default PreferenceSurvey;
