import React from "react";
import "./chat.css";

import { TbArrowBackUp } from "react-icons/tb";

import {
  ImageMessage,
  LinkMessage,
  PdfMessage,
  TextMessage,
  VideoMessage,
} from "./MessageType";
import { DateSeparator } from "../group/MessageType";

const replyOptions = (i) => {
  const deleteHandler = () => {};
  return (
    <span className={i === 0 ? "options first_messages" : "options "}>
      <p>
        <TbArrowBackUp />
        Reply
      </p>
      <p onClick={deleteHandler}>Delete</p>
    </span>
  );
};
const Messages = ({
  i,
  changeVisibility,
  visible,
  val,
  userId,
  search,
  token,
  setVisible,
  deviceType,
}) => {
  const messageHandler = (val) => {
    switch (val.type) {
      case "text":
        return (
          <TextMessage
            user_id={userId}
            changeVisibility={changeVisibility}
            visible={visible}
            val={val}
            i={i}
            search={search}
            token={token}
            setVisible={setVisible}
            deviceType={deviceType}
          />
        );
      case "link":
        return (
          <LinkMessage
            user_id={userId}
            changeVisibility={changeVisibility}
            visible={visible}
            val={val}
            i={i}
            search={search}
            token={token}
            setVisible={setVisible}
          />
        );
      case "video":
        return (
          <VideoMessage
            user_id={userId}
            changeVisibility={changeVisibility}
            visible={visible}
            val={val}
            i={i}
            search={search}
            token={token}
            setVisible={setVisible}
          />
        );
      case "image":
        return (
          <ImageMessage
            user_id={userId}
            changeVisibility={changeVisibility}
            visible={visible}
            val={val}
            i={i}
            search={search}
            token={token}
            setVisible={setVisible}
          />
        );
      case "zip":
        return (
          <PdfMessage
            user_id={userId}
            changeVisibility={changeVisibility}
            visible={visible}
            val={val}
            i={i}
            search={search}
            token={token}
            setVisible={setVisible}
          />
        );
      case "pdf":
        return (
          <PdfMessage
            user_id={userId}
            changeVisibility={changeVisibility}
            visible={visible}
            val={val}
            i={i}
            search={search}
            token={token}
            setVisible={setVisible}
          />
        );
      case "date":
        return <DateSeparator val={val} />;
    }
  };

  return (
    <>
      <div className="message_main_container">{messageHandler(val)}</div>
    </>
  );
};

export default Messages;
