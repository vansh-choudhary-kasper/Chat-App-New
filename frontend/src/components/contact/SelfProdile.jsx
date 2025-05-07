import { useState } from "react";
import { IoClose, IoPencil, IoCheckmark, IoCamera } from "react-icons/io5";
import profile from "../../assets/img/manprofile.png";
import "./SelfProfile.css"; // Import the CSS file
import { useDispatch } from "react-redux";
import { updateUserProfile } from "../../redux/slice/userSlice";
import Cookies from "js-cookie";

const SelfProfile = ({ user, handleClose, setProfileToggle }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [aboutText, setAboutText] = useState(
    user?.about || "Hey! I am using this chat app."
  );
  const [profilePic, setProfilePic] = useState(user?.profile || null);
  const [profileFile, setProfileFile] = useState(null); // Store file separately for dispatch

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    setIsEditing(false);
    const userData = Cookies.get("user");

    const formData = new FormData();
    formData.append("about", aboutText);
    if (profileFile) {
      formData.append("file", profileFile);
    }
    if (userData) {
      const parsedData = JSON.parse(userData);
      const token = parsedData.token;
      formData.append("user_id", parsedData.userId);
      dispatch(updateUserProfile({ formData, token }));
    }
    // Dispatch async thunk
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileFile(file);
      setProfilePic(URL.createObjectURL(file)); // Show preview
    }
  };

  return (
    <div className="selfprofile">
      <div className="selfprofile-header">
        <h3>Profile</h3>
        <div className="cross-icon" onClick={() => setProfileToggle(false)}>
          <IoClose />
        </div>
      </div>
      <hr className="selfprofile-header_hr" />
      <div className="users-contact">
        {isEditing && (
          <label className="camera-icon">
            <IoCamera />
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </label>
        )}
        <div className="dp-bx">
          <img src={profilePic} alt="Profile" />
        </div>
        <p className="user-name">
          {user?.firstname} {user?.lastname || "Your Name"}
        </p>
      </div>

      <div className="about">
        <div className="about-header">
          <p>About</p>
          {isEditing ? (
            <IoCheckmark
              className="edit-icon save-icon"
              onClick={handleSaveClick}
            />
          ) : (
            <IoPencil className="edit-icon" onClick={handleEditClick} />
          )}
        </div>
        {isEditing ? (
          <textarea
            className="about-input"
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            autoFocus
          />
        ) : (
          <p className="about-text">{aboutText}</p>
        )}
      </div>

      {isEditing && (
        <button className="save-btn" onClick={handleSaveClick}>
          Save
        </button>
      )}
    </div>
  );
};
export default SelfProfile;
