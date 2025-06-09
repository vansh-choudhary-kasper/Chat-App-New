import React, { useState, useEffect } from "react";
import { IoClose, IoCallOutline, IoTrash, IoCamera } from "react-icons/io5";
import { HiOutlineVideoCamera } from "react-icons/hi";
import { GrEdit, GrNext } from "react-icons/gr";
import { BsImage } from "react-icons/bs";
import { FaPlayCircle, FaFileAlt, FaEdit } from "react-icons/fa";
import "./groupProfile.css";
import { useSelector } from "react-redux";
import MediaPage from "./MediaPage";
import Cookies from "js-cookie";
import { removeMemberHandler, updateGroupProfile } from "../../redux/slice/messageSlice";
import { useDispatch } from "react-redux";

const GroupProfile = ({
  setGroupProfile,
  profile,
  groupCallHandler,
  current_group,
}) => {
  const {
    group_chat: { messages },
  } = useSelector((state) => state.conversation);
  const [openMediaPage, setOpenMediaPage] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [access, setAccess] = useState(null);
  const [editGroup, setEditGroup] = useState(false);
  const [groupImage, setGroupImage] = useState(
    current_group?.groupProfile || profile
  );
  const [profileFile, setProfileFile] = useState(null); // Store file separately for dispatch
  const [groupName, setGroupName] = useState(current_group?.groupName);
  const dispatch = useDispatch();
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
  let mediaMessages = [];
  let videoPdfImgMessage = [];
  let linkMessages = [];
  let docMessages = [];
  messages?.forEach((val) => {
    if (val.type === "video" || val.type === "image") {
      mediaMessages.push(val);
      videoPdfImgMessage.push(val);
    } else if (val.type === "link") {
      linkMessages.push(val);
    } else if (val.type === "zip" || val.type === "pdf") {
      docMessages.push(val);
      videoPdfImgMessage.push(val);
    }
  });

  useEffect(() => {
    const userData = Cookies.get("user");

    if (!userData) return;
    const parsedData = JSON.parse(userData);
    setUserId(parsedData.userId);
    setToken(parsedData.token);
  }, []);

  useEffect(() => {
    if(current_group) {
      const user = current_group.participants.find((member) => 
        member.user._id === userId
      );
      setAccess(user?.role);
      console.log(user);
      console.log(current_group.participants);
    }
  }, [current_group, userId]);

  const handleShowMediaPage = () => {
    setOpenMediaPage(!openMediaPage);
  };

  const handleEditGroup = () => {
    setEditGroup(!editGroup);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setGroupImage(URL.createObjectURL(file)); // Show preview
      setProfileFile(file);
    }
  };    

  const handleSaveGroup = () => {
    const userData = Cookies.get("user");
    if (!userData) return;
    const parsedData = JSON.parse(userData);
    const token = parsedData.token;
    const formData = new FormData();
    formData.append("group_name", groupName);
    formData.append("group_id", current_group._id);
    formData.append("user_id", parsedData.userId);
    if (profileFile) {
      formData.append("file", profileFile);
    }
    dispatch(updateGroupProfile({ formData, token, groupId: current_group._id }));
    setEditGroup(false);
  };
  return (
    <>
      <div className="group-profile">
        <div className="group-header">
          <h3>Group Info</h3>
          <div className="cross-icon" onClick={() => setGroupProfile(false)}>
            <IoClose />
          </div>
        </div>
        <hr />
        <div className="group-details">
          <div className="dp-bx">
            {editGroup && (
              <label className="camera-icon">
                <IoCamera />
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </label>
            )}
            <img
              src={groupImage}
              alt="Group Profile"
            />
          </div>
        {editGroup ? (
          <div className="group-name-edit">
            <input
              type="text"
              className="group-name-input"
              defaultValue={groupName || "Group Name"}
              onChange={(e) => {
                setGroupName(e.target.value);
              }}
            />

            <button className="save-btn" onClick={handleSaveGroup}>
              Save
            </button>
          </div>
        ) : (
          <p className="group-name">
            {current_group?.groupName || "Group Name"}
          </p>
        )}
          <div className="group-calls">
            <button onClick={groupCallHandler}>
              <HiOutlineVideoCamera />
            </button>
            <button onClick={groupCallHandler}>
              <IoCallOutline />
            </button>
            <button onClick={handleEditGroup}>
              <GrEdit />
            </button>
          </div>
        </div>

        <div className="group_medias">
          <div className="media-title">
            <p>Media, Links, and Docs</p>
            <p onClick={handleShowMediaPage}>
              {
                messages.filter(
                  (val) => val.type !== "text" && val.type !== "date"
                ).length
              }{" "}
              <GrNext />
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
                  <img src={media.file} alt="Media" />
                ) : media.type === "video" ? (
                  <video src={media.file} poster={media.preview}></video>
                ) : (
                  <span>
                    <FaFileAlt />
                  </span>
                )}
                {media.type === "video" && <FaPlayCircle />}
                {media.type === "image" && <BsImage />}
              </div>
            ))}
          </div>
        </div>
        <div className="participants">
          <div className="participants_heading">
            <p>Participants</p>
            <p>{current_group?.participants.length}</p>
          </div>

          <ul>
            {current_group?.participants?.filter((member) => member.status !== 'left').map((member) => (
              <li key={member.id} className="participant-item">
                <div className="participant-info">
                  <img src={member.user?.profile || profile} alt="Member" />
                  <span>
                    {member.user.firstname} {member.user.lastname}
                  </span>
                </div>
                {access === "admin" ? (
                  <IoTrash
                    className="remove-icon"
                    onClick={() => {
                      try {
                        dispatch(
                          removeMemberHandler({
                            member: member.user._id,
                            groupId: current_group._id,
                            userId: userId,
                            token: token,
                          })
                        );
                      } catch (error) {
                        console.error("error on calling removeMemberHandler", error);
                      }
                    }}
                  />
                ) : (
                  <></>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {openMediaPage && (
        <MediaPage
          mediaMessgaes={mediaMessages}
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

export default GroupProfile;
