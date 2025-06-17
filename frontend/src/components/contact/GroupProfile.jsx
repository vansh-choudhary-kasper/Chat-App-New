import React, { useState, useEffect } from "react";
import { IoClose, IoCallOutline, IoTrash, IoCamera, IoExitOutline } from "react-icons/io5";
import { HiOutlineVideoCamera } from "react-icons/hi";
import { GrEdit, GrNext } from "react-icons/gr";
import { BsImage } from "react-icons/bs";
import { FaPlayCircle, FaFileAlt, FaCrown } from "react-icons/fa";
import "./groupProfile.css";
import { useSelector } from "react-redux";
import MediaPage from "./MediaPage";
import Cookies from "js-cookie";
import { removeMemberHandler, updateGroupProfile, makeAdminHandler, removeAdminHandler, leaveGroupHandler } from "../../redux/slice/messageSlice";
import { useDispatch } from "react-redux";

const GroupProfile = ({
  setGroupProfile,
  profile,
  groupCallHandler,
  current_group,
  adminPanelStyle = false,
  messages = []
}) => {
  // const {
  //   group_chat: { messages },
  // } = useSelector((state) => state.conversation);
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
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState("");
  const [assignmentType, setAssignmentType] = useState("random");
  const [userExist, setUserExist] = useState(false);

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
    let user = current_group.participants.find((member) => member?.user?._id?.toString() === userId);
    setUserExist(user && user?.status !== 'left');
  }, [current_group]);

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

  const handleLeaveGroup = () => {
    const currentUser = current_group.participants.find(
      member => member.user._id === userId
    );
    const activeAdmins = current_group.participants.filter(member => member.role === "admin" && member.user._id !== userId);
    console.error("activeAdmins => ", activeAdmins);
    
    if (currentUser?.role === "admin" && activeAdmins.length === 0) {
      setShowLeaveModal(true);
    } else {
      const confirmed = window.confirm("Are you sure you want to leave this group?");
      if (confirmed) {
        dispatch(
          leaveGroupHandler({
            groupId: current_group._id,
            userId: userId,
            assignmentType: "random",
            token: token
          })
        );
      }
    }
  };

  const handleConfirmLeave = () => {
    const newAdminId = assignmentType === "manual" ? selectedNewAdmin : null;
    
    dispatch(
      leaveGroupHandler({
        groupId: current_group._id,
        userId: userId,
        newAdminId,
        assignmentType,
        token: token
      })
    );
    setShowLeaveModal(false);
  };

  const getEligibleMembers = () => {
    return current_group?.participants?.filter(
      member => member.user._id !== userId && member.status !== 'left'
    ) || [];
  };
  return (
    <>
      <div className="group-profile">
        <div className="group-header">
          <h3>Group Info</h3>
          <div className="header-actions">
            {userId && userExist && !adminPanelStyle && (
              <IoExitOutline
                className="leave-icon"
                title="Leave Group"
                onClick={handleLeaveGroup}
              />
            )}
            <div className="cross-icon" onClick={() => setGroupProfile(false)}>
              <IoClose />
            </div>
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
            {/* <button onClick={groupCallHandler}>
              <IoCallOutline />
            </button> */}
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
                  (val) => val.type !== "text" && val.type !== "date" && val.type !== "addMember" && val.type !== "removeMember" && val.type !== "leftMember"
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
                <div className="member-actions">
                  {member.role === "admin" && (
                    <FaCrown className="admin-icon" title="Admin" />
                  )}
                  {!adminPanelStyle && access === "admin" && member.user._id !== userId && (
                    <>
                      {member.role !== "admin" ? (
                        <FaCrown
                          className="make-admin-icon"
                          title="Make Admin"
                          onClick={() => {
                            dispatch(
                              makeAdminHandler({
                                memberId: member.user._id,
                                groupId: current_group._id,
                                requesterId: userId,
                                token: token
                              })
                            );
                          }}
                        />
                      ) : (
                        <FaCrown
                          className="remove-admin-icon"
                          title="Remove Admin"
                          onClick={() => {
                            dispatch(
                              removeAdminHandler({
                                memberId: member.user._id,
                                groupId: current_group._id,
                                requesterId: userId,
                                token: token
                              })
                            );
                          }}
                        />
                      )}
                      <IoTrash
                        className="remove-icon"
                        title="Remove Member"
                        onClick={() => {
                          dispatch(
                            removeMemberHandler({
                              member: member.user._id,
                              groupId: current_group._id,
                              userId: userId,
                              token: token,
                            })
                          );
                        }}
                      />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Leave Group Modal */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="leave-modal">
            <div className="modal-header">
              <h3>Leave Group</h3>
              <IoClose 
                className="close-modal" 
                onClick={() => setShowLeaveModal(false)} 
              />
            </div>
            <div className="modal-content">
              <p>As the group creator, you need to transfer ownership before leaving.</p>
              
              <div className="assignment-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="assignmentType"
                    value="random"
                    checked={assignmentType === "random"}
                    onChange={(e) => setAssignmentType(e.target.value)}
                  />
                  <span>Assign randomly to an active member</span>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    name="assignmentType"
                    value="manual"
                    checked={assignmentType === "manual"}
                    onChange={(e) => setAssignmentType(e.target.value)}
                  />
                  <span>Choose a specific member</span>
                </label>
              </div>

              {assignmentType === "manual" && (
                <div className="member-selection">
                  <label>Select new group creator:</label>
                  <select
                    value={selectedNewAdmin}
                    onChange={(e) => setSelectedNewAdmin(e.target.value)}
                    required
                  >
                    <option value="">Choose a member...</option>
                    {getEligibleMembers().map((member) => (
                      <option key={member.user._id} value={member.user._id}>
                        {member.user.firstname} {member.user.lastname}
                        {member.role === "admin" ? " (Admin)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowLeaveModal(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleConfirmLeave}
                disabled={assignmentType === "manual" && !selectedNewAdmin}
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

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
