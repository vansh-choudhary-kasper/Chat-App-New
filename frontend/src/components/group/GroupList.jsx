import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import profile from "../../assets/img/manprofile.png";
import { RESET_STATE } from '../../redux/rootReducers';
import { persistor, store } from '../../redux/store';
import Cookies from "js-cookie";
import { useNavigate } from 'react-router-dom';
import { fetchSelectedGroup } from '../../redux/slice/messageSlice';
const GroupList = ({ val, user_id, token,handleClick,}) => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const unseen = val.messages.length > 0 && val.messages.filter((val) => val.seen === "unseen" && val.to === user_id);
  const timeAgo =
  val.messages.length > 0 && val.messages[0].created_at
    ? val.messages[0].created_at
    : null;
  function formatMessageTime(created_at) {
    const date = new Date(created_at);
    const now = new Date();

    // Helper function to format the time in 12-hour format
    const formatTime = (date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const suffix = hours >= 12 ? "pm" : "am";
      const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
      const formattedMinutes = minutes.toString().padStart(2, "0");
      return `${formattedHours}:${formattedMinutes}${suffix}`;
    };

    // Check if the date is today
    if (date.toDateString() === now.toDateString()) {
      return formatTime(date); // Return time for today
    }

    // Check if the date is yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday`;
    }

    // For older dates, return dd/mm/yy format
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of the year
    return `${day}/${month}/${year}`;
  }
  const {
    group_chat: { current_group },
  } = useSelector((state) => state.conversation);
  
  const selectChatHandler = (val) => {
    if (
      (current_group === null || current_group._id !== val) &&
      val !== undefined
    ) {
      
      dispatch(fetchSelectedGroup({ search: val, user_id, token }))
        .unwrap()
        .then(() => {})
        .catch(() => {
          store.dispatch({ type: RESET_STATE });
          persistor.purge();
          Cookies.remove("user");
          navigate("/");
        });
      return;
    }
  };
  return (
    <div
      className="chatlist_main_container"
      style={
        (current_group?._id === val._id )
          ? {border:"none", borderBottom: "none" ,backgroundColor: "#F1F1FF" }
          : {border:"none", borderBottom: "1px solid #DFDFDF" }
      }
      
    
      onClick={() => selectChatHandler(val._id)}
    >
      

      <div className="chatlist"  >
      
    
        <div className="chatlist_image_container">
          <img src={val?.groupProfile?val?.groupProfile:profile} alt="profile" />
        </div>
        <div className="chatlist_name_container">
        <h4>{`${val.groupName}`.slice(0, 12)}</h4>

        

          {val?.messages[0]?.text !== "null" ? (
            <p
              style={
                current_group?._id !== val._id
                  ? unseen.length > 0
                    ? { color: "#6A6A6A", fontWeight: "700" }
                    : { color: "#6A6A6A" }
                  : unseen.length > 0
                  ? { color: "#6169FF", fontWeight: "700" }
                  : { color: "#6A6A6A" }
              }
            >
              
              {val?.messages[0]?.text?.length > 22
                ? `${val?.messages[0]?.text?.slice(0, 22)}...`
                : val?.messages[0]?.text}
            
            </p>
          ) : (
            <p
              style={
                current_group?._id !== val._id
                  ? unseen.length > 0
                    ? { color: "#6A6A6A", fontWeight: "700" }
                    : { color: "#6A6A6A" }
                  : unseen.length > 0
                  ? { color: "#6169FF", fontWeight: "700" }
                  : { color: "#6A6A6A" }
              }
            >
              {val?.messages[0]?.type}
    
            </p>
          )}
        </div>
      </div>
      <div className="chat_timeago">

     { timeAgo?<p>{formatMessageTime(timeAgo)}</p>:<></>}
        <div
          className="unread"
          style={unseen.length === 0 || unseen===false? { visibility: "hidden" } : {}}
        >
          <h3 
          style={unseen.length > 0 ? { fontWeight: "700" } : {}}
          >
            {unseen.length > 4 ? "4+" : unseen.length}
           
          </h3>
        </div>
      </div>
     
      {/* </div> */}
    </div>
  )
}

export default GroupList
