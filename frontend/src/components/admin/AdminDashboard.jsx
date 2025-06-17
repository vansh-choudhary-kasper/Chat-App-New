// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchAdminData } from "../../redux/slice/adminSlice";
// import Cookies from "js-cookie";
// import "./AdminDashboard.css"; // Add styles to make layout responsive and clean

// import {
//   TextMessage,
//   ImageMessage,
//   VideoMessage,
//   PdfMessage,
//   LinkMessage,
// } from "../chat/MessageType";

// function MessageBubble({ msg }) {
//   if (msg.type === "text") {
//     return <TextMessage msg={msg} />;
//   } else if (msg.type === "image") {
//     return <ImageMessage msg={msg} />;
//   } else if (msg.type === "video") {
//     return <VideoMessage msg={msg} />;
//   } else if (msg.type === "pdf") {
//     return <PdfMessage msg={msg} />;
//   } else if (msg.type === "link") {
//     return <LinkMessage msg={msg} />;
//   } else {
//     return <p>Unknown message type: {msg.type}</p>;
//   }
// }

// const AdminDashboardDetailed = () => {
//   const dispatch = useDispatch();
//   const adminData = useSelector((state) => state.admin?.data);
//   const loading = useSelector((state) => state.admin?.loading);
//   const error = useSelector((state) => state.admin?.error);
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [view, setView] = useState("personal"); // "personal" or "group"

//   useEffect(() => {
//     try {
//       const userData = Cookies.get("user");
//       if (!userData) return;
//       const parsedData = JSON.parse(userData);
//       if (parsedData?.token) {
//         dispatch(fetchAdminData({ token: parsedData.token }));
//       }
//     } catch (err) {
//       console.error("Invalid cookie data:", err);
//     }
//   }, [dispatch]);

//   if (loading) return <p>Loading admin data...</p>;
//   if (error) return <p className="error">Error: {error}</p>;

//   // Helper to get user info by ID
//   const getUserById = (id) => {
//     return adminData?.users?.find((user) => user._id === id);
//   };

//   // Message bubble component for better UI
//   const MessageBubble = ({ msg }) => {
//     const sender = getUserById(msg.from);
//     const isDateType = msg.type === "date";
//     return (
//       <div className={`message-bubble ${isDateType ? "date-message" : "text-message"}`}>
//         {!isDateType && sender && (
//           <div className="sender-info">
//             <img src={sender.profile} alt={`${sender.firstname} ${sender.lastname}`} className="sender-profile" />
//             <span className="sender-name">{sender.firstname} {sender.lastname}</span>
//           </div>
//         )}
//         <div className="message-content">
//           {isDateType ? (
//             <span className="date-text">{new Date(msg.created_at).toLocaleDateString()}</span>
//           ) : (
//             <p className="message-text">{msg.text || "[No Text]"}</p>
//           )}
//           <span className="message-time">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="admin-dashboard">
//       <div className="side-nav">
//         <h2>Admin Panel</h2>
//         <button onClick={() => setView("personal")}>Personal Chats</button>
//         <button onClick={() => setView("group")}>Group Chats</button>
//         <button onClick={() => setView("users")}>All Users</button>
//       </div>

//       <div className="main-content">
//         {view === "users" && (
//           <div>
//             <h3>Total Users: {adminData?.users?.length}</h3>
//             <div className="user-list">
//               {adminData?.users?.map((user) => (
//                 <div className="user-card" key={user._id}>
//                   <img src={user.profile} alt="Profile" />
//                   <div>
//                     <strong>{user.firstname} {user.lastname}</strong>
//                     <p>{user.email}</p>
//                     <span className={user.status === "Online" ? "status-online" : "status-offline"}>{user.status}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {view === "personal" && (
//           <div className="chat-section">
//             <div className="chat-list">
//               {adminData?.personalChats?.map((chat) => (
//                 <div key={chat._id} className={`chat-item ${selectedChat?._id === chat._id ? "selected" : ""}`} onClick={() => setSelectedChat(chat)}>
//                   <strong>{chat.participants?.map(p => p.firstname).join(", ")}</strong>
//                   <p>Messages: {chat.messages?.length}</p>
//                 </div>
//               ))}
//             </div>
//             <div className="chat-detail">
//               {selectedChat ? (
//                 <>
//                   <h4>Chat ID: {selectedChat._id}</h4>
//                   <div className="messages-container">
//                     {selectedChat.messages?.map((msg) => (
//                       <MessageBubble key={msg._id} msg={msg} />
//                     ))}
//                   </div>
//                 </>
//               ) : <p>Select a chat to view details</p>}
//             </div>
//           </div>
//         )}

//         {view === "group" && (
//           <div className="chat-section">
//             <div className="chat-list">
//               {adminData?.groupChats?.map((group) => (
//                 <div key={group._id} className={`chat-item ${selectedChat?._id === group._id ? "selected" : ""}`} onClick={() => setSelectedChat(group)}>
//                   <strong>{group.groupName}</strong>
//                   <p>{group.participants?.length} Participants</p>
//                 </div>
//               ))}
//             </div>
//             <div className="chat-detail">
//               {selectedChat ? (
//                 <>
//                   <h4>Group: {selectedChat.groupName}</h4>
//                   <div className="messages-container">
//                     {selectedChat.messages?.map((msg) => (
//                       <MessageBubble key={msg._id} msg={msg} />
//                     ))}
//                   </div>
//                 </>
//               ) : <p>Select a group to view details</p>}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AdminDashboardDetailed;


import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminData } from "../../redux/slice/adminSlice";
import Cookies from "js-cookie";
import "./AdminDashboard.css"; // Add styles to make layout responsive and clean

import {
  TextMessage,
  ImageMessage,
  VideoMessage,
  PdfMessage,
  LinkMessage,
} from "../chat/MessageType";
import { DateSeparator, MemberSeparator } from "../group/MessageType";
import GroupProfile from "../contact/GroupProfile";

const AdminDashboardDetailed = () => {
  const dispatch = useDispatch();
  const adminData = useSelector((state) => state.admin?.data);
  const loading = useSelector((state) => state.admin?.loading);
  const error = useSelector((state) => state.admin?.error);
  const [selectedChat, setSelectedChat] = useState(null);
  const [view, setView] = useState("personal"); // "personal" or "group"
  const [visible, setVisible] = useState(null);
  const [groupProfile, setGroupProfile] = useState(false);

  useEffect(() => {
    try {
      const userData = Cookies.get("user");
      if (!userData) return;
      const parsedData = JSON.parse(userData);
      if (parsedData?.token) {
        dispatch(fetchAdminData({ token: parsedData.token }));
      }
    } catch (err) {
      console.error("Invalid cookie data:", err);
    }
  }, [dispatch]);

  if (loading) return <p>Loading admin data...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  // Helper to get user info by ID
  const getUserById = (id) => {
    return adminData?.users?.find((user) => user._id === id);
  };

  const MessageBubble = ({ msg, index }) => {
    const sender = getUserById(msg.from);
    const isDateType = msg.type === "date";
    return (
      <div className={`message-bubble ${isDateType ? "date-message" : "text-message"}`}>
        {!isDateType && sender && (
          <div className="sender-info">
            <img src={sender.profile} alt={`${sender.firstname} ${sender.lastname}`} className="sender-profile" />
            <span className="sender-name">{sender.firstname} {sender.lastname}</span>
          </div>
        )}
        <div className="message-content">
          {/* {isDateType ? (
            <DateSeparator date={msg} />
          ) : (
            // <p className="message-text">{msg.text || "[No Text]"}</p>
          )} */}
          {renderMessage(msg, index)}
          {/* <span className="message-time">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> */}
        </div>
      </div>
    );
  };

  // Helper to render message based on type using imported components
  const renderMessage = (msg, index) => {
    const sender = getUserById(msg.from);
    const commonProps = {
      i: index,
      val: msg,
      visible,
      setVisible,
      user_id: sender?._id,
      token: "", // token not used here, can be passed if needed
      changeVisibility: (e, i) => setVisible(i === visible ? null : i),
    };

    switch (msg.type) {
      case "text":
        return <TextMessage key={msg._id} {...commonProps} replyOff={true} />;
      case "image":
        return <ImageMessage key={msg._id} {...commonProps} replyOff={true} />;
      case "video":
        return <VideoMessage key={msg._id} {...commonProps} replyOff={true} />;
      case "pdf":
      case "zip":
        return <PdfMessage key={msg._id} {...commonProps} replyOff={true} />;
      case "link":
        return <LinkMessage key={msg._id} {...commonProps} replyOff={true} />;
      case "date":
        return <DateSeparator val={msg} />;
      case "addMember":
        return <MemberSeparator
          current_group={selectedChat}
          val={msg}
          type="add"
        />;
      case "removeMember":
        return <MemberSeparator
          current_group={selectedChat}
          val={msg}
          type="remove"
        />;
      case "leftMember":
        return <MemberSeparator
          current_group={selectedChat}
          val={msg}
          type="left"
        />;
      default:
        return (
          <div key={msg._id} className="text-message">
            {msg.text || "[No Text]"}
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="side-nav">
        <h2>Admin Panel</h2>
        <button onClick={() => setView("personal")}>Personal Chats</button>
        <button onClick={() => setView("group")}>Group Chats</button>
        <button onClick={() => setView("users")}>All Users</button>
      </div>

      <div className="main-content">
        {view === "users" && (
          <div>
            <h3>Total Users: {adminData?.users?.length}</h3>
            <div className="user-list">
              {adminData?.users?.map((user) => (
                <div className="user-card" key={user._id}>
                  <img src={user.profile} alt="Profile" />
                  <div>
                    <strong>{user.firstname} {user.lastname}</strong>
                    <p>{user.email}</p>
                    <span className={user.status === "Online" ? "status-online" : "status-offline"}>{user.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "personal" && (
          <div className="chat-section">
            <div className="chat-list">
              {adminData?.personalChats?.map((chat) => (
                <div key={chat._id} className={`chat-item ${selectedChat?._id === chat._id ? "selected" : ""}`} onClick={() => setSelectedChat(chat)}>
                  <strong>{chat.participants?.map(p => p.firstname).join(", ")}</strong>
                  <p>Messages: {chat.messages?.length}</p>
                </div>
              ))}
            </div>
            <div className="chat-detail">
              {selectedChat ? (
                <>
                  <h4>Chat ID: {selectedChat._id}</h4>
                  {/* <div className="messages-container">
                    
                  </div> */}
                  <div className="messages-container">
                    {selectedChat.messages?.map((msg, index) => (
                      <MessageBubble key={msg._id} msg={msg} index={index} />
                    ))}
                    {/* {selectedChat.messages?.map((msg, index) => renderMessage(msg, index))} */}
                  </div>
                </>
              ) : <p>Select a chat to view details</p>}
            </div>
          </div>
        )}

        {view === "group" && (
          <div className="chat-section">
            <div className="chat-list">
              {adminData?.groupChats?.map((group) => (
                <div key={group._id} className={`chat-item ${selectedChat?._id === group._id ? "selected" : ""}`} onClick={() => setSelectedChat(group)}>
                  <strong>{group.groupName}</strong>
                  <p>{group.participants?.length} Participants</p>
                </div>
              ))}
            </div>
            <div className="chat-detail">
              {selectedChat ? (
                <>
                  <h4 onClick={() => setGroupProfile(true)} style={{cursor:'pointer'}}>Group: {selectedChat.groupName}</h4>
                  <div className="messages-container">
                    {selectedChat.messages?.map((msg, index) => (
                      <MessageBubble key={msg._id} msg={msg} index={index} />
                    ))}
                  </div>
                  {groupProfile ? (
                    <GroupProfile
                      setGroupProfile={setGroupProfile}
                      profile={groupProfile}
                      current_group={selectedChat}
                      adminPanelStyle={true}
                      messages={selectedChat.messages}
                    />
                  ) : (
                    <></>
                  )}
                </>
              ) : <p>Select a group to view details</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardDetailed;
