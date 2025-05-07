import React, { useEffect, useState } from "react";
import "./chat.css";
import Messages from "./Messages";
import { useSelector } from "react-redux";

const Chat = ({ userId, token, deviceType }) => {
  const {
    direct_chat: { messages, current_conversation },
  } = useSelector((state) => state.conversation);

  useEffect(() => {}, [messages]);

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
              deviceType={deviceType}
              key={i}
              userId={userId}
              i={i}
              token={token}
              search={current_conversation}
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
