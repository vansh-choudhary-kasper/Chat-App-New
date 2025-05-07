import React, { useState, useRef } from "react";
import "./messagetype.css";
import { BsDownload } from "react-icons/bs";
import { MdMoreVert } from "react-icons/md";
import { AiOutlineFilePdf } from "react-icons/ai";
import { AiOutlineFileZip } from "react-icons/ai";
import waaa from "../../assets/img/waaa.jpg";
import { IoPlayCircleSharp } from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import { messageStatus, editMsgHandler } from "../../redux/slice/messageSlice";
import { TbArrowBackUp } from "react-icons/tb";
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
    return `yesterday ${formatTime(date)}`;
  }

  // For older dates, return dd/mm hh:mmam/pm format
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
  return `${day}/${month} ${formatTime(date)}`;
}

const ReplyOptions = (i, search, val, dispatch, token, setVisible) => {
  const [showEditInput, setShowEditInput] = useState(false);
  const [editMessage, setEditMessage] = useState(val.text);

  const deleteHandler = (chatId, messageId, token, to, from, val) => {
    dispatch(messageStatus({ chatId, messageId, token, to, from }));
    setVisible(null);
  };

  const editHandler = async (chatId, messageId, token, to, from, val) => {
    await dispatch(editMsgHandler({ search, messageId, token, newText: editMessage, to, from }));
    setVisible(null);
  };

  return (
    <span className={i === 0 ? "options first_messages" : "options "}>
      <p>
        <TbArrowBackUp />
        Reply
      </p>
      {showEditInput ? (
        <div className="edit_message">
          <input
            type="text"
            placeholder="Edit Message"
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
          />
          <button
            onClick={() => {
              setShowEditInput(false);
              editHandler(search, val._id, token, val.to, val.from, val);
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <p
          className="edit_options"
          onClick={() => setShowEditInput(true)}
        >
          Edit
        </p>
      )}
      {/* <p
        className="edit_options"
        onClick={() =>
          editHandler(search, val._id, token, val.to, val.from, val)
        }
      >
        Edit
      </p> */}
      <p
        className="delete_options"
        onClick={() =>
          deleteHandler(search, val._id, token, val.to, val.from, val)
        }
      >
        Delete
      </p>
    </span>
  );
};
const handleDownload = (fileUrl, fileName = "download") => {
  fetch(fileUrl)
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || fileUrl.split("/").pop(); // Use provided name or extract from URL
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => console.error("Download failed:", error));
};
export const ImageMessage = ({
  i,
  changeVisibility,
  visible,
  val,
  user_id,
  search,
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
  return (
    <>
      <div
        className={
          val.from !== user_id ? "image_message" : " image_message_recieve"
        }
      >
        <li className="message_time">{formatMessageTime(val.created_at)}</li>
        <div className="message_image_main_container">
          {val.loading ? <div className="messageLoader"></div> : <></>}
          <div className="message_image_container">
            <img
              src={val.file}
              alt="man"
              onClick={() => handleImageClick(val.file)}
            />
            {visible === i ? (
              ReplyOptions(i, search, val, dispatch, token, setVisible)
            ) : (
              <></>
            )}
          </div>
          {val.text !== "null" ? <p>{val.text}</p> : <></>}
        </div>

        {val.loading ? (
          <></>
        ) : (
          <MdMoreVert
            onClick={(e) => changeVisibility(e, i)}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>
      {previewImage && (
        <div className="preview_modal" onClick={closePreview}>
          <div className="preview_modal_content">
            <img src={previewImage} alt="Preview" className="preview_image" />
            <button
              onClick={() => handleDownload(val.file, "myfile")}
              href={previewImage}
              download="image.jpg"
              className="download_button"
            >
              <BsDownload />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export const LinkMessage = ({
  i,
  changeVisibility,
  visible,
  val,
  user_id,
  search,
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
  return (
    <>
      <div
        className={
          val.from !== user_id ? "image_message" : " image_message_recieve"
        }
      >
        <li className="message_time">{formatMessageTime(val.created_at)}</li>
        <div className="message_image_main_container">
          <div
            className="message_image_container"
            onClick={() => handleImageClick(val.preview)}
          >
            {val.preview ? <img src={val.preview} alt="man" /> : <></>}
            {visible === i ? (
              ReplyOptions(i, search, val, dispatch, token, setVisible)
            ) : (
              <></>
            )}
          </div>
          {val.text ? (
            <p
              onClick={() => window.open(val.text, "target:_blank")}
              style={{ color: "blue", cursor: "pointer" }}
            >
              {val.text}
            </p>
          ) : (
            <></>
          )}
        </div>

        {val.loading ? (
          <></>
        ) : (
          <MdMoreVert
            onClick={(e) => changeVisibility(e, i)}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>
      {previewImage && val.preview && (
        <div className="preview_modal" onClick={closePreview}>
          <div className="preview_modal_content">
            <img src={val.preview} alt="Preview" className="preview_image" />
            <button
              onClick={() => handleDownload(val.file, "myfile")}
              className="download_button"
            >
              <BsDownload />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export const VideoMessage = ({
  i,
  changeVisibility,
  visible,
  val,
  user_id,
  search,
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

  return (
    <>
      <div
        className={
          val.from !== user_id ? "video_message" : "video_message_receive"
        }
      >
        <li className="message_time">{formatMessageTime(val.created_at)}</li>
        <div className="message_video_main_container">
          <div
            className="message_video_container"
            onClick={() => handleVideoClick(val.file)}
          >
            {val.loading ? <div className="messageLoader"></div> : <></>}
            <IoPlayCircleSharp />
            <video
              src={val.file}
              alt="Preview"
              className="video_thumbnail"
              controls={false}
              poster={val.preview}
            />
          </div>
          {val.text !== "null" ? <p>{val.text}</p> : <></>}
        </div>
        {visible === i
          ? ReplyOptions(i, search, val, dispatch, token, setVisible)
          : null}
        {val.loading ? (
          <></>
        ) : (
          <MdMoreVert
            onClick={(e) => changeVisibility(e, i)}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>

      {previewVideo && (
        <div className="preview_modal" onClick={closePreview}>
          <div className="preview_modal_content">
            <video
              ref={videoRef}
              src={val.file}
              controls
              className="preview_video"
              autoPlay
            />
            <button
              onClick={() => handleDownload(val.file, "myfile")}
              className="download_button"
            >
              <BsDownload />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const PdfMessage = ({
  i,
  changeVisibility,
  visible,
  val,
  user_id,
  search,
  token,
  setVisible,
}) => {
  const dispatch = useDispatch();
  return (
    <div
      className={val.from !== user_id ? "pdf_message" : "pdf_message_recieve"}
    >
      {val.loading ? <div className="messagePdfLoader"></div> : <></>}

      <li className="message_time">{formatMessageTime(val.created_at)}</li>

      <div
        className="message_pdf_container"
        onClick={() => window.open(val.file)}
      >
        {val.type === "pdf" ? (
          <AiOutlineFilePdf className="pdf_icon" />
        ) : (
          <AiOutlineFileZip className="pdf_icon" />
        )}

        {val.filename ? (
          <p className="file_name">
            {val.filename.length < 20
              ? val.filename
              : `${val.filename.slice(0, 20)}...`}
          </p>
        ) : (
          <></>
        )}
        <button
          onClick={() => handleDownload(val.file, "myfile")}
          className="pdf_download_button"
        >
          <BsDownload />
        </button>
      </div>

      {visible === i
        ? 
        ReplyOptions(i, search, val, dispatch, token, setVisible)
        : null}
      {val.loading ? (
        <></>
      ) : (
        <MdMoreVert
          onClick={(e) => changeVisibility(e, i)}
          style={{ cursor: "pointer" }}
        />
      )}
    </div>
  );
};
export const TextMessage = ({
  i,
  changeVisibility,
  visible,
  val,
  user_id,
  search,
  token,
  setVisible,
  deviceType,
}) => {
  const dispatch = useDispatch();
  return (
    <div
      className={
        val.from === user_id
          ? deviceType
            ? "message_recieve mobileTextMessage"
            : "message_recieve"
          : deviceType
          ? "message mobileTextMessage"
          : "message"
      }
    >
      <li className="message_time">{formatMessageTime(val.created_at)}</li>
      <div className="reply_message">
        {val.replyType === "text" && (
          <p className="text_reply_message">{val.reply.slice(0, 80)}</p>
        )}
        <p
          style={
            val.text === "This message is deleted"
              ? { fontStyle: "italic", color: "#6169FF" }
              : {}
          }
        >
          {val.text}
          {visible === val._id ? (
            ReplyOptions(i, search, val, dispatch, token, setVisible)
          ) : (
            <></>
          )}
        </p>
      </div>
      {val.text === "This message is deleted" ? (
        <></>
      ) : (
        <MdMoreVert
          onClick={(e) => changeVisibility(e, val._id)}
          style={{ cursor: "pointer" }}
        />
      )}
    </div>
  );
};
