import React, { useEffect, useRef, useState } from "react";
import "./chatlayout.css";
import profiles from "../../assets/img/manprofile.png";
import { useSelector, useDispatch } from "react-redux";
import {
  chatStatus,
  fetchSelectedConversation,
} from "../../redux/slice/messageSlice";
import Cookies from "js-cookie";
import { persistor, store } from "../../redux/store";
import { RESET_STATE } from "../../redux/rootReducers";
import { useNavigate } from "react-router-dom";
import { socket } from "../../context/context";
import { v4 as uuidv4 } from "uuid";

const Chatlist = ({
  val,
  user_id,
  token,
  handleClick,
  showOptions,
  active,
}) => {
  const navigate = useNavigate();

  const { firstname, lastname, status, _id, profile } = val.participants[0];

  const unseen =
    val.messages?.length > 0 &&
    val.messages.filter((val) => val.seen?.length === 0 && val.to === user_id);
  const timeAgo =
    val.messages?.length > 0 && val.messages[0].created_at
      ? val.messages[0].created_at
      : null;

  const dispatch = useDispatch();
  const {
    direct_chat: { current_conversation, current_user },
  } = useSelector((state) => state.conversation);

  function formatMessageTime(created_at) {
    const date = new Date(created_at);
    const now = new Date();

    const formatTime = (date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const suffix = hours >= 12 ? "pm" : "am";
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes.toString().padStart(2, "0");
      return `${formattedHours}:${formattedMinutes}${suffix}`;
    };

    if (date.toDateString() === now.toDateString()) {
      return formatTime(date);
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday`;
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of the year
    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    const userData = Cookies.get("user");
    if (current_conversation && userData) {
      const parsedData = JSON.parse(userData);
      const user_id = parsedData.userId;
      const token = parsedData.token;
      dispatch(
        fetchSelectedConversation({
          search: current_conversation,
          user_id,
          token,
        })
      )
        .unwrap()
        .then((data) => {
          const roomId = uuidv4();
          const selectedUser = data[0].participants.filter(
            (val) => val._id !== user_id
          );

          const current_user = selectedUser[0];
          socket.emit("join_room", {
            to: current_user._id,
            from: user_id,
            roomId,
          });
        })
        .catch((error) => {
          console.error("Error fetching selected conversation ->", error);
          // store.dispatch({ type: RESET_STATE });
          // persistor.purge();
          // Cookies.remove("user");
          // navigate("/");
        });
    }
  }, []);

  const selectChatHandler = (val) => {
    if (
      (current_conversation === null || current_conversation !== val) &&
      val !== undefined
    ) {
      dispatch(fetchSelectedConversation({ search: val, user_id, token }))
        .unwrap()
        .then((data) => {
          const selectedUser = data[0].participants.filter(
            (val) => val._id !== user_id
          );
          const roomId = uuidv4();
          const current_user = selectedUser[0];
          socket.emit("join_room", {
            to: current_user._id,
            from: user_id,
            roomId,
          });
        })
        .catch((error) => {
          console.error("Error fetching selected conversation ->", error);
          // store.dispatch({ type: RESET_STATE });
          // persistor.purge();
          // Cookies.remove("user");
          // navigate("/");
        });
      return;
    }
  };

  const chatStatusHandler = (e, chatId, status, token, user_id) => {
    e.stopPropagation();
    dispatch(chatStatus({ chatId, status, token, user_id }));
  };

  return (
    <div
      className="chatlist_main_container"
      style={
        current_conversation === val._id && current_user._id === _id
          ? { border: "none", borderBottom: "none", backgroundColor: "#F1F1FF" }
          : { border: "none", borderBottom: "1px solid #DFDFDF" }
      }
      // onDoubleClick={() => {
      //   setShowOptions(val._id);
      // }}
      onClick={() => handleClick(val._id, selectChatHandler)}
    >
      {showOptions === val._id && (
        <div className="options_box">
          {active === "chat" ? (
            <button
              onClick={(e) =>
                chatStatusHandler(e, showOptions, "archive", token, user_id)
              }
            >
              Move to Archive
            </button>
          ) : (
            <button
              onClick={(e) =>
                chatStatusHandler(e, showOptions, "chat", token, user_id)
              }
            >
              Unarchive
            </button>
          )}
        </div>
      )}
      {/* <div className='chatlist_container'> */}
      <div className="chatlist">
        {status && status === "Online" ? (
          <span className="chatlist_status"></span>
        ) : (
          <></>
        )}
        <div className="chatlist_image_container">
          <img src={profile ? profile : profiles} alt="profile" />
        </div>
        <div className="chatlist_name_container">
          <h4>{`${firstname} ${lastname}`.slice(0, 16)}</h4>

          {val?.messages[0]?.text !== "null" ? (
            <p
              style={
                current_conversation !== val._id
                  ? unseen.length > 0
                    ? { color: "#6A6A6A", fontWeight: "700" }
                    : { color: "#6A6A6A" }
                  : unseen.length > 0
                  ? { color: "#6169FF", fontWeight: "700" }
                  : { color: "#6A6A6A" }
              }
            >
              {val?.messages[0]?.text?.length > 18
                ? `${val?.messages[0]?.text?.slice(0, 18)}...`
                : val?.messages[0]?.text}
            </p>
          ) : (
            <p
              style={
                current_conversation !== val._id
                  ? unseen.length > 0
                    ? { color: "#6A6A6A", fontWeight: "700" }
                    : { color: "#6A6A6A" }
                  : unseen.length > 0
                  ? { color: "#6169FF", fontWeight: "700" }
                  : { color: "#6169FF" }
              }
            >
              {val?.messages[0]?.type}
            </p>
          )}
        </div>
      </div>
      <div className="chat_timeago">
        {timeAgo ? <p>{formatMessageTime(timeAgo)}</p> : <></>}
        <div
          className="unread"
          style={
            unseen.length === 0 || unseen === false
              ? { visibility: "hidden" }
              : {}
          }
        >
          <h3 style={unseen.length > 0 ? { fontWeight: "700" } : {}}>
            {unseen.length > 4 ? "4+" : unseen.length}
          </h3>
        </div>
      </div>

      {/* </div> */}
    </div>
  );
};

export default Chatlist;
