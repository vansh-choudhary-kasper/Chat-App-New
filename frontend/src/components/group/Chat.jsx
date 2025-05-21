import React, { useEffect, useState, useContext } from "react";
import "./chat.css";
import { MdMoreVert } from "react-icons/md";
import { TbArrowBackUp } from "react-icons/tb";
import Messages from "./Messages";
import { useSelector } from "react-redux";
import { SharedContext } from "../../utils/replyContext";

const Chat = ({ userId, token }) => {
  const {
    group_chat: { messages, current_group },
  } = useSelector((state) => state.conversation);
  const { replyChat, setReplyChat } = useContext(SharedContext);

  useEffect(() => {
    return () => {
      setReplyChat();
    };
  }, [messages]);

  const [visible, setVisible] = useState(null);
  const changeVisibility = (e, i) => {
    if (i === visible) {
      setVisible(null);

      return;
    }
    setVisible(i);
  };
  return (
    <div className="chat_section_container">
      {messages ? (
        <>
          {messages.map((val, i) => (
            <Messages
              key={i}
              userId={userId}
              i={i}
              token={token}
              search={current_group?._id}
              current_group={current_group}
              val={val}
              visible={visible}
              setVisible={setVisible}
              changeVisibility={changeVisibility}
            />
          ))}
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Chat;
