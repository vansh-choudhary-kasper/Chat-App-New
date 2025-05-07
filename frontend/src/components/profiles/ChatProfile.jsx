import React from "react";
import "./chatProfile.css";
import { RiCloseLargeFill } from "react-icons/ri";
import profile from "../../assets/img/profile.jpeg";
const ChatProfile = () => {
  return (
    <div className="chat_profile">
      <div className="chat_profile_right">
        <div className="chat_profile_right_top">
          <h3>Contact Info</h3>
          <RiCloseLargeFill />
        </div>
        <hr></hr>
        <div className="chat_profile_right_bottom">
          <div className="chat_profile_right_bottom_profile">
            <div className="chat_profile_image_container">
              <img src={profile} alt="profile" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatProfile;
