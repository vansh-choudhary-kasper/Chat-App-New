import React from "react";
import "./chat.css";

import { TbArrowBackUp } from "react-icons/tb";
import { GoImage } from "react-icons/go";
import { AiOutlineFilePdf } from "react-icons/ai";
import { HiOutlineVideoCamera } from "react-icons/hi2";
import { AiOutlineFileZip } from "react-icons/ai";

import {
  DateSeparator,
  MemberSeparator,
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
      case "addMember":
        return <MemberSeparator 
          current_group={current_group}
          val={val} 
          user_id={userId}
          type="add"
        />;
      case "removeMember":
        return <MemberSeparator 
          current_group={current_group}
          val={val} 
          user_id={userId}
          type="remove"
        />;
      case "leftMember":
        return <MemberSeparator 
          current_group={current_group}
          val={val} 
          user_id={userId}
          type="left" 
        />;
    }
  };

  const iconChoiceHandler = (replyChat) => {
    switch (replyChat.type) {
      case "video":
        return <HiOutlineVideoCamera />;
      case "image":
        return <GoImage />;
      case "zip":
        return <AiOutlineFileZip />;
      case "pdf":
        return <AiOutlineFilePdf />
    }
  }

  const replyContainer = (replyChat) => {
    return (
      <div>
        <p>Reply to {replyChat.type === "text" ? replyChat.text : <>{iconChoiceHandler(replyChat)} {replyChat.filename} </>}</p>
      </div>
    );
  };

  return (
    <>
      <div className="message_main_container">
        <div className="message_container">
          {val.reply && Object.keys(val.reply).length !== 0 ? replyContainer(val.reply) : <></>}
        </div>
        {messageHandler(val)}
      </div>
    </>
  );
};

export default Messages;
