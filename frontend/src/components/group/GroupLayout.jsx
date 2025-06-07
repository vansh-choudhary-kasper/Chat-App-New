import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { GoPlusCircle } from "react-icons/go";
import { PiChatCenteredTextLight } from "react-icons/pi";
import { RiInboxArchiveLine } from "react-icons/ri";
import { AiOutlineClose } from "react-icons/ai";
import { FiUsers } from "react-icons/fi";
import { CiSearch } from "react-icons/ci";
import { BsPinAngle } from "react-icons/bs";
import "./GroupLayout.css";
// import Chatlist from "./Chatlist";
import profile from "../../assets/img/manprofile.png";
import nochat from "../../assets/img/noChat.png";
// import Chat from "./Chat";
import { FiPhone } from "react-icons/fi";
import { BsChatDots } from "react-icons/bs";
// import Header from "./Header";
// import Footer from "./Footer";
import { contextData, socket } from "../../context/context";
import { fetchUsers } from "../../redux/slice/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineCloseCircle } from "react-icons/ai";
import {
  fetchConversations,
  sendMessage,
  checkConversation,
  setMessagesValue,
  messageStatu,
  groupHandler,
  fetchGroups,
  addGroup,
  removeGroup, 
  addedOnGroup,
  groupUpdated,
  groupMessageStatus, 
  editGroupMessage
} from "../../redux/slice/messageSlice";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { persistor, store } from "../../redux/store";
import { setStatus } from "../../redux/slice/messageSlice";
import { toast } from "react-toastify";
import Chatlist from "../chat/Chatlist";
import GroupList from "./GroupList";
import Header from "./Header";
import Footer from "./Footer";
import Chat from "./Chat";
import { RESET_GROUP_CHAT } from "../../redux/rootReducers";
import {SharedContext} from "../../utils/replyContext";

const GroupLayout = () => {
  const [active, setActive] = useState("chat");
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [groupName, setGroupName] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [groupImage, setGroupImage] = useState(null);
  const dispatch = useDispatch();

  const { guests } = useSelector((state) => state.guests);
  const [suggested, setSuggested] = useState(guests);

  const {
    group_chat: { groups, current_group },
  } = useSelector((state) => state.conversation);
  const { deviceType } = useContext(contextData);
  const [replyChat, setReplyChat] = useState();

  const navigate = useNavigate();
  const [group, setGroup] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [fileValue, setFileValue] = useState(null);
  const userData = Cookies.get("user");
  useEffect(() => {
    if (userData) {
      const parsedData = JSON.parse(userData);
      setUserId(parsedData.userId);
      setToken(parsedData.token);
    }
  }, [userData]);
  useEffect(() => {
    const userData = Cookies.get("user");

    if (!userData) return;
    const parsedData = JSON.parse(userData);

    if (!socket) return;
    socket.on("new_group", (data) => {
      dispatch(addGroup({ data, userId: parsedData.userId }));
    });
    socket.on("delete_group_message", (data) => {
      dispatch(groupMessageStatus(data));
    });
    socket.on("edit_group_message", (data) => {
      dispatch(editGroupMessage(data));
    });
    socket.on("user_status", (data) => {
      dispatch(setStatus(data));
    });
    socket.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
      if (
        err.message === "Authentication error" ||
        err.message === "Invalid token"
      ) {
        navigate("/");
      }
    });
    socket.on("group_removed_you", (data) => {
      dispatch(removeGroup(data));
    });
    socket.on("group_added_you", (data) => {
      dispatch(addedOnGroup(data));
    });
    socket.on("group_updated", (data) => {
      console.log("data => ", data);
      dispatch(groupUpdated(data));
    });
    return () => {
      if(socket) {
      // socket.off("group_message");
      socket.off("delete_group_message");
      socket.off("edit_group_message");
      socket.off("user_status");
      socket.off("connect_error");
      socket.off("group_updated");
      }
    };
  }, [socket]);
  useEffect(() => {
    let pinneds = [];
    let grouped = [];

    groups?.forEach((val) => {
      if (val.groupstatus === "group") {
        grouped.push(val);
      } else {
        pinneds.push(val);
      }
    });

    setGroup(grouped);
    setPinned(pinneds);
  }, [groups, active]);
  useEffect(() => {
    if (query.trim() === "") {
      setShowSuggestions(false);
      return;
    }

    const debounceTimeout = setTimeout(() => {
      dispatch(fetchUsers({ query, userId, token }))
        .unwrap()
        .then((response) => {
          const remaining = response.filter((val) => {
            return !selectedUsers.some((value) => value._id === val._id);
          });
          setSuggested(remaining);
        })
        .catch((error) => {
          setShowSuggestions(false);
          if (error === "Unauthorized") {
            persistor.purge();
            Cookies.remove("user");

            navigate("/");
          }
        });
      if (suggested?.length > 0) {
        setShowSuggestions(true);
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [query, dispatch]);
  useEffect(() => {
    setShowSuggestions(suggested?.length > 0);
  }, [suggested]);

  useEffect(() => {
    const userData = Cookies.get("user");

    if (userData) {
      const parsedData = JSON.parse(userData);
      dispatch(
        fetchGroups({
          userid: parsedData.userId,
          token: parsedData.token,
        })
      )
        .unwrap()
        .then((response) => {})
        .catch((error) => {
          if (error === "Unauthorized") {
            persistor.purge();
            Cookies.remove("user");

            navigate("/");
          }
        });
    } else {
      persistor.purge();
      navigate("/");
    }
    return () => {
      store.dispatch({ type: RESET_GROUP_CHAT });
    };
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileValue(file);
      setGroupImage(URL.createObjectURL(file)); // Store the image as a preview
    }
  };
  let debounceTimeout;
  const findHandler = (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      let grouped = [];
      let pinneds = [];

      groups?.forEach((item) => {
        if (
          item.groupName.toLowerCase().includes(e.target.value.toLowerCase())
        ) {
          if (item.groupstatus === "group") {
            grouped.push(item);
          } else {
            pinneds.push(item);
          }
        }
      });

      setGroup(grouped);
      setPinned(pinneds);
    }, 300);
  };

  const groupHandle = () => {
    if (
      groupName === null ||
      groupName.length === 0 ||
      selectedUsers.length < 2
    ) {
      toast.error("Group name with two members needed.");
    } else {
      let allMembers = selectedUsers.map((val) => {
        return val._id;
      });
      allMembers.push(userId);

      const formData = new FormData();
      formData.append("groupName", groupName);
      formData.append("groupMember", JSON.stringify(allMembers));
      if (groupImage) {
        formData.append("file", fileValue);
      }
      dispatch(groupHandler({ formData, token }));
      setModalOpen(false);
      setQuery("");
      setGroupName(null);
      setSelectedUsers([]);
    }
  };
  return (
    <>
      {modalOpen && (
        <div className="group_modal_overlay">
          <div className="group_modal_main_container">
            <div className="group_modal_header_container">
              <div className="group_modal_header">
                <FiUsers />
                <h3>Create Group</h3>
              </div>
              <AiOutlineClose
                className="group_modal_close_button"
                onClick={() => {
                  setModalOpen(false);
                  setQuery("");
                  setGroupName(null);
                  setSelectedUsers([]);
                }}
              />
            </div>

            {/* Image Upload - Hidden File Input */}
            <div className="group_modal_image_upload_container">
              <label htmlFor="groupImage" className="group_modal_image_label">
                {groupImage ? (
                  <div className="group_modal_image_preview_container">
                    <img
                      src={groupImage}
                      alt="Group Preview"
                      className="group_modal_image_preview"
                    />
                  </div>
                ) : (
                  <span className="group_modal_image_placeholder">+</span>
                )}
              </label>
              <input
                id="groupImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </div>

            <div className="group_modal_input_container">
              <h3>Group Name</h3>
              {groupName !== null && groupName.length === 0 && (
                <span>Group name is required</span>
              )}
              <input
                type="text"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>
            {selectedUsers.length > 0 && (
              <div className="group_modal_selected_users">
                {selectedUsers.map((user) => (
                  <div className="group_modal_selected_user" key={user._id}>
                    <span>
                      {user.firstname.length > 6
                        ? `${user.firstname.slice(0, 6)}...`
                        : `${user.firstname}`}
                    </span>
                    <AiOutlineClose
                      className="remove_user_icon"
                      onClick={() => {
                        setSelectedUsers((prev) =>
                          prev.filter((selected) => selected._id !== user._id)
                        );
                        suggested.unshift(user);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {/* Add Members */}
            <div className="group_modal_input_container">
              <h3>Add Members</h3>
              {selectedUsers.length !== 0 && selectedUsers.length < 2 && (
                <span>Minimum two people is required</span>
              )}
              <input
                type="text"
                placeholder="Type to search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Suggestions Container */}
            {showSuggestions && (
              <div className="group_modal_suggestions_container">
                {suggested?.slice(0, 5).map((user) => (
                  <div
                    key={user._id}
                    className="group_modal_suggestion"
                    onClick={() => {
                      if (!selectedUsers.find((u) => u._id === user._id)) {
                        setSelectedUsers((prev) => [...prev, user]);
                        const remaining = guests.filter(
                          (guest) =>
                            !selectedUsers.some(
                              (selected) => selected._id === guest._id
                            ) && guest._id !== user._id
                        );
                        setSuggested(remaining);
                      }
                    }}
                  >
                    <div className="group_modal_image_container">
                      <img
                        src={user.profile ? user.profile : profile}
                        alt="profile"
                      />
                    </div>
                    <span>{`${user.firstname} ${user.lastname}`}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="group_modal_button_container">
              <button
                className="group_close"
                onClick={() => {
                  setModalOpen(false);
                  setQuery("");
                  setGroupName(null);
                  setSelectedUsers([]);
                }}
              >
                Cancel
              </button>
              <button
                className="group_submit"
                disabled={
                  groupName === null ||
                  groupName.length === 0 ||
                  selectedUsers.length < 2
                    ? true
                    : false
                }
                onClick={() => groupHandle()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="chatlayout"
        style={deviceType === "mobile" ? { width: "100vw" } : {}}
      >
        {deviceType === "mobile" ? (
          <>
            {current_group !== null ? (
              <div className="selected_group_container mobile_chat_container">
                <SharedContext.Provider value={{ replyChat, setReplyChat }}>
                  <Header userId={userId} />
                  <hr />
                  <Chat userId={userId} token={token} />

                  <Footer token={token} />
                </SharedContext.Provider>
              </div>
            ) : (
              <div className="chat_message_container mobile_chat_container">
                <div className="chat_heading">
                  <h5>Groups</h5>
                  <GoPlusCircle onClick={() => setModalOpen(true)} />
                </div>
                <hr />
                <div className="group_main_container">
                  <div className="group_search_container">
                    <div className="group_input_container">
                      <input
                        placeholder="Search by group"
                        onChange={(e) => findHandler(e)}
                      />
                    </div>
                    <div className="group_search_button">
                      <CiSearch />
                    </div>
                  </div>
                  <div className="group_list_container">
                    {/* { pinned.length>0?     <div className="pinned_groups_container">
                 <div className="pinned_groups">
                <BsPinAngle /><p>Pinned</p>
                
                </div>
                {pinned?.map((val, i) => (
                      <GroupList
                        val={val}
                        key={i}
                        active={active}
                        // showOptions={showOptions}
                        // handleClick={handleClick}
                        user_id={userId}
                        token={token}
                      />
                    ))}
             </div>:<></>} */}
                    {group.length > 0 ? (
                      <div className="all_groups">
                        <div className="pinned_groups">
                          <p>All Groups</p>
                        </div>
                        {group?.map((val, i) => (
                          <GroupList
                            val={val}
                            key={i}
                            active={active}
                            // showOptions={showOptions}
                            // handleClick={handleClick}
                            user_id={userId}
                            token={token}
                          />
                        ))}
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="chat_message_container">
              <div className="chat_heading">
                <h5>Groups</h5>
                <GoPlusCircle onClick={() => setModalOpen(true)} />
              </div>
              <hr />
              <div className="group_main_container">
                <div className="group_search_container">
                  <div className="group_input_container">
                    <input
                      placeholder="Search by group"
                      onChange={(e) => findHandler(e)}
                    />
                  </div>
                  <div className="group_search_button">
                    <CiSearch />
                  </div>
                </div>
                <div className="group_list_container">
                  {/* { pinned.length>0?     <div className="pinned_groups_container">
                 <div className="pinned_groups">
                <BsPinAngle /><p>Pinned</p>
                
                </div>
                {pinned?.map((val, i) => (
                      <GroupList
                        val={val}
                        key={i}
                        active={active}
                        // showOptions={showOptions}
                        // handleClick={handleClick}
                        user_id={userId}
                        token={token}
                      />
                    ))}
             </div>:<></>} */}
                  {group.length > 0 ? (
                    <div className="all_groups">
                      <div className="pinned_groups">
                        <p>All Groups</p>
                      </div>
                      {group?.map((val, i) => (
                        <GroupList
                          val={val}
                          key={i}
                          active={active}
                          // showOptions={showOptions}
                          // handleClick={handleClick}
                          user_id={userId}
                          token={token}
                        />
                      ))}
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </div>
            {current_group !== null ? (
              <div className="selected_group_container">
                <SharedContext.Provider value={{ replyChat, setReplyChat }}>
                  <Header userId={userId} />
                  <hr />
                  <Chat userId={userId} token={token} />
              
                  { current_group?.isRemoved ? 
                  <div className="group_removed" style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                    {/* <img src={groupRemoved} alt="group_removed" /> */}
                    <p style={{fontSize:'20px', color:'#6169FF'}}>You have been removed from this group</p>
                  </div> :
                  <Footer token={token} /> }
                </SharedContext.Provider>
              </div>
            ) : (
              <div className="noSelected_group_container">
                <img src={nochat} alt="nochat" />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default GroupLayout;
