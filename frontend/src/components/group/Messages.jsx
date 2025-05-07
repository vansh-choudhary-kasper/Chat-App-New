import React from "react";
import "./chat.css";

import { TbArrowBackUp } from "react-icons/tb";

import {
  DateSeparator,
  ImageMessage,
  LinkMessage,
  PdfMessage,
  TextMessage,
  VideoMessage,
} from "./MessageType";

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
  current_group,
}) => {
  const messageHandler = (val) => {
    switch (val.type) {
      case "text":
        return (
          <TextMessage
            date="25/11/1998"
            user_id={userId}
            changeVisibility={changeVisibility}
            visible={visible}
            val={val}
            i={i}
            search={search}
            current_group={current_group}
            token={token}
            setVisible={setVisible}
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
            current_group={current_group}
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
            current_group={current_group}
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
            current_group={current_group}
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
            current_group={current_group}
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
            current_group={current_group}
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
      <div className="group_message_main_container">
        {messageHandler(val)}

        {/* <ReplyMessages  i={i} changeVisibility={changeVisibility} visible={visible}/> */}
        {/* <ImageMessage i={i} changeVisibility={changeVisibility} visible={visible} /> */}
        {/* <VideoMessage i={i} changeVisibility={changeVisibility} visible={visible}/> */}
        {/* <PdfMessage i={i} changeVisibility={changeVisibility} visible={visible}  pdfSrc={pdfsrc} fileName={"abhaydfffffffffffff.pdf"}/> */}
      </div>
    </>
  );
};

export default Messages;
