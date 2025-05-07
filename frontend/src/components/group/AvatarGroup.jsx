import React from "react";
import "./AvatarGroup.css";
import profile from "../../assets/img/manprofile.png"
const AvatarGroup = ({ users, maxVisible = 4 }) => {
  const visibleUsers = users.slice(0, maxVisible);
  const extraCount = users.length - maxVisible;

  return (
    <div className="avatar-group">
      {visibleUsers.map((user, index) => (
        <div
          key={index}
          className={index===0?"first":"avatar"}
          style={{
            
            zIndex: maxVisible - index,
          }}
        >
          <img src={user.user.profile?user.user.profile:profile}/>
        </div>
      ))}
      {extraCount > 0 && (
        <div className="extra-count" title={`${extraCount} more users`}>
          +{extraCount}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
