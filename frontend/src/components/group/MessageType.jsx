import React, { useState, useRef } from "react";
import "./messagetype.css";
import { BsDownload } from "react-icons/bs";
import { MdMoreVert } from "react-icons/md";
import { AiOutlineFilePdf, AiOutlineFileZip } from "react-icons/ai";
import { IoPlayCircleSharp } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { messageStatus, editMsgHandler } from "../../redux/slice/messageSlice";
import profile from "../../assets/img/manprofile.png";
import { TbArrowBackUp } from "react-icons/tb";
import Cookies from "js-cookie";
import { handleDownload } from "../../utils/helper";

// Format message time
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
    return `${formatTime(date)}`;
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month} ${formatTime(date)}`;
}
function formatMessage(created_at) {
  const date = new Date(created_at);
  const now = new Date();

  // Function to format time
  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const suffix = hours >= 12 ? "pm" : "am";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${formattedHours}:${formattedMinutes}${suffix}`;
  };

  // Check if the date is today
  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }

  // Check if the date is yesterday
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  // For older dates, return in the format 'DD Month YYYY'
  const day = date.getDate();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

const EditVisibility = (val) => {
  const [showEditInput, setShowEditInput] = useState(false);
  const [editMessage, setEditMessage] = useState(val.text || "");

  return { showEditInput, setShowEditInput, editMessage, setEditMessage };
}

const userData = Cookies.get("user");
let parsedData;
let userId;
if (userData) {
  parsedData = JSON.parse(userData);
  userId = parsedData.userId;
}

// Options for reply
const replyOptions = (i, search, val, dispatch, token, setVisible, editVisible = true) => {
  let data;
  if(editVisible){
    data = EditVisibility(val);
  } 
  const deleteHandler = (chatId, messageId, token, to, from, val) => {
    console.log('val = ', val);
    dispatch(messageStatus({ chatId, messageId, token, to, from, val }));
    setVisible(null);
  };

  const editHandler = async (chatId, messageId, token, to, from, val) => {
    console.log('val = ', val);
    await dispatch(editMsgHandler({ search, messageId, token, newText: data?.editMessage, to, from, val }));
    setVisible(null);
  };

  return (
    <span
      className={
        i === 0 ? "group_options group_first_messages" : "group_options"
      }
    >
      <p>
        <TbArrowBackUp />
        Reply
      </p>
      {val?.from === userId ? ( <>
      {editVisible ? data?.showEditInput ? (
        <div className="edit_message">
          <input
            type="text"
            placeholder="Edit Message"
            value={data?.editMessage}
            onChange={(e) => data?.setEditMessage(e.target.value)}
          />
          <button
            onClick={() => {
              data?.setShowEditInput(false);
              editHandler(search, val._id, token, val.to, val.from, val);
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <p
          className="edit_options"
          onClick={() => data?.setShowEditInput(true)}
        >
          Edit
        </p>
      ) : <></>}
      <p
        onClick={() =>
          deleteHandler(search, val._id, token, val.to, val.from, val)
        }
      >
        Delete
      </p>
      </>) : (<></>)}
    </span>
  );
};

// Image message component
export const ImageMessage = ({
  i,
  changeVisibility,
  visible,
  val,
  user_id,
  current_group,
  token,
  setVisible,
}) => {
  const [previewImage, setPreviewImage] = useState(null);
  const dispatch = useDispatch();

  const handleImageClick = (image) => {
    setPreviewImage(image);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };
  const messageFrom = current_group.participants.filter(
    (user) => user.user._id === val.from
  );
  return (
    <>
      {val.from !== user_id ? (
        <div className="group_message_profile_container">
          <div className="group_message_profile">
            <img
              src={
                messageFrom[0].user.profile
                  ? messageFrom[0].user.profile
                  : profile
              }
              alt="ww"
            />
          </div>
          <span>
            {messageFrom[0].user.firstname} {messageFrom[0].user.lastname}
          </span>
        </div>
      ) : (
        <></>
      )}
      <div
        className={
          val.from !== user_id
            ? "group_image_message"
            : "group_image_message_receive"
        }
      >
        <li className="group_message_time">
          {formatMessageTime(val.created_at)}
        </li>
        <div className="group_message_image_main_container">
          {val.loading && <div className="group_messageLoader"></div>}
          <div
            className="group_message_image_container"
            onClick={() => handleImageClick(val.file)}
          >
            <img src={val.file} alt="man" />
            {visible === i &&
              replyOptions(
                i,
                current_group._id,
                val,
                dispatch,
                token,
                setVisible,
                false
              )}
          </div>
          {val.text !== "null" && <p>{val.text}</p>}
        </div>

        {val.loading ? null : (
          <MdMoreVert
            onClick={(e) => changeVisibility(e, i)}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>

      {previewImage && (
        <div className="group_preview_modal" onClick={closePreview}>
          <div className="group_preview_modal_content">
            <img
              src={previewImage}
              alt="Preview"
              className="group_preview_image"
            />
            <button
              onClick={() => handleDownload(val.file, val.filename)}
              className="group_download_button"
            >
              <BsDownload />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Link message component
export const LinkMessage = ({
  i,
  changeVisibility,
  visible,
  val,
  user_id,
  current_group,
  token,
  setVisible,
}) => {
  const [previewImage, setPreviewImage] = useState(null);
  const dispatch = useDispatch();

  const handleImageClick = (image) => {
    setPreviewImage(image);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };
  const messageFrom = current_group.participants.filter(
    (user) => user.user._id === val.from
  );
  return (
    <>
      {val.from !== user_id ? (
        <div className="group_message_profile_container">
          <div className="group_message_profile">
            <img
              src={
                messageFrom[0].user.profile
                  ? messageFrom[0].user.profile
                  : profile
              }
              alt="ww"
            />
          </div>
          <span>
            {messageFrom[0].user.firstname} {messageFrom[0].user.lastname}
          </span>
        </div>
      ) : (
        <></>
      )}
      <div
        className={
          val.from !== user_id
            ? "group_image_message"
            : "group_image_message_receive"
        }
      >
        <li className="group_message_time">
          {formatMessageTime(val.created_at)}
        </li>
        <div className="group_message_image_main_container">
          <div
            className="group_message_image_container"
            onClick={() => handleImageClick(val.preview)}
          >
            {val.preview && <img src={val.preview} alt="man" />}
            {visible === i &&
              replyOptions(
                i,
                current_group._id,
                val,
                dispatch,
                token,
                setVisible, 
                false
              )}
          </div>
          {val.text && (
            <p
              onClick={() => window.open(val.text, "target:_blank")}
              className="group_link_text"
            >
              {val.text}
            </p>
          )}
        </div>

        {val.loading ? null : (
          <MdMoreVert
            onClick={(e) => changeVisibility(e, i)}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>

      {previewImage && val.preview && (
        <div className="group_preview_modal" onClick={closePreview}>
          <div className="group_preview_modal_content">
            <img
              src={val.preview}
              alt="Preview"
              className="group_preview_image"
            />
            <button
              onClick={() => handleDownload(val.file, val.filename)}
              className="group_download_button"
            >
              <BsDownload />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Video message component
export const VideoMessage = ({
  i,
  changeVisibility,
  visible,
  val,
  user_id,
  current_group,
  token,
  setVisible,
}) => {
  const [previewVideo, setPreviewVideo] = useState(null);
  const videoRef = useRef(null);
  const dispatch = useDispatch();

  const handleVideoClick = (video) => {
    setPreviewVideo(video);
  };

  const closePreview = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setPreviewVideo(null);
  };
  const messageFrom = current_group.participants.filter(
    (user) => user.user._id === val.from
  );
  return (
    <>
      {val.from !== user_id ? (
        <div className="group_message_profile_container">
          <div className="group_message_profile">
            <img
              src={
                messageFrom[0].user.profile
                  ? messageFrom[0].user.profile
                  : profile
              }
              alt="ww"
            />
          </div>
          <span>
            {messageFrom[0].user.firstname} {messageFrom[0].user.lastname}
          </span>
        </div>
      ) : (
        <></>
      )}
      <div
        className={
          val.from !== user_id
            ? "group_video_message"
            : "group_video_message_receive"
        }
      >
        <li className="group_message_time">
          {formatMessageTime(val.created_at)}
        </li>
        <div className="group_message_video_main_container">
          <div
            className="group_message_video_container"
            onClick={() => handleVideoClick(val.file)}
          >
            {val.loading && <div className="group_messageLoader"></div>}
            <IoPlayCircleSharp />
            <video
              src={val.file}
              alt="Preview"
              className="group_video_thumbnail"
              controls={false}
            // poster={val.preview}
            />
          </div>
          {val.text !== "null" && <p>{val.text}</p>}
        </div>
        {visible === i &&
          replyOptions(i, current_group._id, val, dispatch, token, setVisible, false)}
        {val.loading ? null : (
          <MdMoreVert
            onClick={(e) => changeVisibility(e, i)}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>

      {previewVideo && (
        <div className="group_preview_modal" onClick={closePreview}>
          <div className="group_preview_modal_content">
            <video
              ref={videoRef}
              src={val.file}
              controls
              className="group_preview_video"
              autoPlay
            />
            <button
              onClick={() => handleDownload(val.file, val.filename)}
              className="group_download_button"
            >
              <BsDownload />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// PDF message component
export const PdfMessage = ({
  i,
  changeVisibility,
  visible,
  val,
  user_id,
  current_group,
  token,
  setVisible,
}) => {
  const dispatch = useDispatch();
  const messageFrom = current_group.participants.filter(
    (user) => user.user._id === val.from
  );
  return (
    <>
      {" "}
      {val.from !== user_id ? (
        <div className="group_message_profile_container">
          <div className="group_message_profile">
            <img
              src={
                messageFrom[0].user.profile
                  ? messageFrom[0].user.profile
                  : profile
              }
              alt="ww"
            />
          </div>
          <span>
            {messageFrom[0].user.firstname} {messageFrom[0].user.lastname}
          </span>
        </div>
      ) : (
        <></>
      )}
      <div
        className={
          val.from !== user_id
            ? "group_pdf_message"
            : "group_pdf_message_receive"
        }
      >
        {val.loading && <div className="group_messagePdfLoader"></div>}
        <li className="group_message_time">
          {formatMessageTime(val.created_at)}
        </li>

        <div
          className="group_message_pdf_container"
          onClick={() => window.open(val.file)}
        >
          {val.type === "pdf" ? (
            <AiOutlineFilePdf className="group_pdf_icon" />
          ) : (
            <AiOutlineFileZip className="group_pdf_icon" />
          )}
          {val.filename && (
            <p className="group_file_name">
              {val.filename.length < 20
                ? val.filename
                : `${val.filename.slice(0, 20)}...`}
            </p>
          )}
          <button
              onClick={() => handleDownload(val.file, val.filename)}
              className="group_pdf_download_button"
            >
              <BsDownload />
            </button>
        </div>

        {visible === i &&
          replyOptions(i, current_group._id, val, dispatch, token, setVisible, false)}
        {val.loading ? null : (
          <MdMoreVert
            onClick={(e) => changeVisibility(e, i)}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>
    </>
  );
};

// Text message component
export const TextMessage = ({
  i,
  changeVisibility,
  visible,
  val,
  user_id,

  current_group,
  token,
  setVisible,
}) => {
  const dispatch = useDispatch();

  const messageFrom = current_group.participants.filter(
    (user) => user.user._id === val.from
  );

  return (
    <>
      {val.from !== user_id ? (
        <div className="group_message_profile_container">
          <div className="group_message_profile">
            <img
              src={
                messageFrom[0]?.user?.profile
                  ? messageFrom[0].user.profile
                  : profile
              }
              alt="ww"
            />
          </div>
          <span>
            {messageFrom[0]?.user?.firstname ? messageFrom[0].user.firstname : "unknown"} {messageFrom[0]?.user?.lastname}
          </span>
        </div>
      ) : (
        <></>
      )}
      <div
        className={
          val.from === user_id ? "group_message_receive" : "group_message"
        }
      >
        <li className="group_message_time">
          {formatMessageTime(val.created_at)}
        </li>
        <div className="group_reply_message">
          {val.replyType === "text" && (
            <p className="group_text_reply_message">{val.reply.slice(0, 80)}</p>
          )}
          <p
            style={
              val.text === "This message is deleted"
                ? { fontStyle: "italic", color: "#6169FF" }
                : {}
            }
          >
            {val.text}
            {visible === val._id &&
              replyOptions(
                i,
                current_group._id,
                val,
                dispatch,
                token,
                setVisible
              )}
          </p>
        </div>
        {val.text !== "This message is deleted" && (
          <MdMoreVert
            onClick={(e) => changeVisibility(e, val._id)}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>
    </>
  );
};
export const DateSeparator = ({ val }) => {
  return (
    <div className="date-separator">
      <hr className="date-line" />
      <span className="date-text">{formatMessage(val.created_at)}</span>
      <hr className="date-line" />
    </div>
  );
};
