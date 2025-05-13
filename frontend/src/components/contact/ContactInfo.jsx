import React, { useState } from "react";
import { IoClose, IoCallOutline } from "react-icons/io5";
import { HiOutlineVideoCamera } from "react-icons/hi";
import { GrNext } from "react-icons/gr";
import { BsImage } from "react-icons/bs";
import { FaPlayCircle, FaFileAlt } from "react-icons/fa";
import "./contactinfo.css";
import { useSelector } from "react-redux";
import MediaPage from "./MediaPage";

const ContactInfo = ({
  setProfileModal,
  joinVoiceRoom,
  joinVideoRoom,
  current_user,
  profile,
  // handleShowMediaPage,
}) => {
  //   if (!openContact) return null;
  const [openMediaPage, setOpenMediaPage] = useState(false);

  const {
    direct_chat: { messages },
  } = useSelector((state) => state.conversation);
  let videoPdfImgMessage = [];
  let mediaMessgaes = [];
  let linkMessages = [];
  let docMessages = [];
  messages?.forEach((val) => {
    if (val.type === "video" || val.type === "image") {
      mediaMessgaes.push(val);
      videoPdfImgMessage.push(val);
    } else if (val.type === "link") {
      linkMessages.push(val);
    } else if (val.type === "zip" || val.type === "pdf") {
      docMessages.push(val);
      videoPdfImgMessage.push(val);
    }
  });
  const handleShowMediaPage = () => {
    setOpenMediaPage(!openMediaPage);
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
  return (
    <>
      <div className="contact-info">
        <div className="contact-header">
          <h3>Contact Info</h3>
          <div className="cross-icon" onClick={() => setProfileModal(false)}>
            <IoClose />
          </div>
        </div>
        <hr />
        <div className="users-contact">
          <div className="dp-bx">
            <img
              src={current_user?.profile ? current_user?.profile : profile}
              alt="User"
            />
          </div>
          <p className="user-name">
            {current_user?.firstname} {current_user?.lastname || "User Name"}
          </p>
          {/* <p className="user-mob">{user?.phone || "+91-0000000000"}</p> */}
          <div className="user-clls">
            <button onClick={joinVideoRoom}>
              <HiOutlineVideoCamera />
            </button>
            <button onClick={joinVoiceRoom}>
              <IoCallOutline />
            </button>
          </div>
        </div>

        <div className="about">
          <p>About</p>
          <p>{current_user?.about || "No status available"}</p>
        </div>

        <div className="medias">
          <div className="media-title">
            <p>Media, Links, and Docs</p>
            <p onClick={handleShowMediaPage}>
              {
                messages.filter(
                  (val) => val.type !== "text" && val.type !== "date"
                ).length
              }{" "}
              <span>
                <GrNext />
              </span>
            </p>
          </div>
          <div className="media-container">
            {videoPdfImgMessage.slice(0, 4).map((media, index) => (
              <div
                key={index}
                className={`media-items ${media.type}`}
                onClick={() => handleDownload(media.file, media.filename)}
              >
                {media.type === "image" ? (
                  <img src={media.file} alt="Media" loading="lazy" />
                ) : media.type === "video" ? (
                  // console.log(media.preview)
                  <video src={media.file} poster={media.preview}></video>
                ) : (
                  <span>
                    <FaFileAlt />
                  </span>
                )}
                {media.type === "video" && (
                  <span>
                    <FaPlayCircle />
                  </span>
                )}
                {media.type === "image" && (
                  <span>
                    <BsImage />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {openMediaPage && (
        <MediaPage
          mediaMessgaes={mediaMessgaes}
          linkMessages={linkMessages}
          docMessages={docMessages}
          openMediaPage={openMediaPage}
          handleShowMediaPage={handleShowMediaPage}
          handleDownload={handleDownload}
        />
      )}
    </>
  );
};

export default ContactInfo;
