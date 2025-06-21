import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
} from "react";
import { GoPlusCircle } from "react-icons/go";
import { PiChatCenteredTextLight } from "react-icons/pi";
import { RiInboxArchiveLine } from "react-icons/ri";
import { CiSearch } from "react-icons/ci";
import "./chatlayout.css";
import Chatlist from "./Chatlist";
import profile from "../../assets/img/manprofile.png";
import nochat from "../../assets/img/noChat.png";
import Chat from "./Chat";
import { FiPhone, FiUsers } from "react-icons/fi";
import { BsChatDots } from "react-icons/bs";
import Header from "./Header";
import Footer from "./Footer";
import { contextData, socket } from "../../context/context";
import { fetchUsers } from "../../redux/slice/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineClose, AiOutlineCloseCircle } from "react-icons/ai";
import { MdMenu } from "react-icons/md";
import {
  fetchConversations,
  sendMessage,
  checkConversation,
  setMessagesValue,
  messageStatu,
  messageEdit,
} from "../../redux/slice/messageSlice";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { persistor, store } from "../../redux/store";
import { setStatus } from "../../redux/slice/messageSlice";
import { RESET_DIRECT_CHAT } from "../../redux/rootReducers";
import { SharedContext } from "../../utils/replyContext";
import { SquarePen, Search } from "lucide-react";
import { use } from "react";

const ChatLayout = () => {
  // const SharedContext = createContext();
  const [replyChat, setReplyChat] = useState();
  const [active, setActive] = useState("chat");
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dispatch = useDispatch();
  const clickTimeout = useRef(null);
  const { deviceType, sideToggle, setSideToggle } = useContext(contextData);
  const { guests } = useSelector((state) => state.guests);
  const {
    direct_chat: { conversations, current_conversation },
  } = useSelector((state) => state.conversation);

  const data = useSelector((state) => state.conversation);

  const navigate = useNavigate();
  const [chat, setChat] = useState([]);
  const [archive, setArchive] = useState([]);
  useEffect(() => {
    const userData = Cookies.get("user");
    if (!socket) return;
    if (!userData) return;

    const parsedData = JSON.parse(userData);
    // const handleNewMessage = (data) => {
    //   if (
    //     data.conversation_id === current_conversation &&
    //     data.message.to === parsedData.userId
    //   ) {
    //     data.message.seen = "seen";

    //     socket.emit("chat_seen", {
    //       conversation_id: data.conversation_id,
    //       messageId: data.message._id,
    //       to: data.message.to,
    //     });
    //   }

    //   dispatch(sendMessage({ data, userId: parsedData.userId }));
    // };
    // socket.on("new_message", handleNewMessage);
    const handleDeleteMessage = (data) => {
      dispatch(messageStatu(data));
    };
    socket.on("delete_message", handleDeleteMessage);
    const handleEditMessage = (data) => {
      dispatch(messageEdit(data));
    };
    socket.on("edit_message", handleEditMessage);
    const handleUserStatus = (data) => {
      dispatch(setStatus(data));
    };
    socket.on("user_status", handleUserStatus);
    const handleConnectError = (err) => {
      console.error("Connection error:", err.message); // Logs the error message sent from the server
      if (
        err.message === "Authentication error" ||
        err.message === "Invalid token"
      ) {
        persistor.purge();
        Cookies.remove("user");
        navigate("/");
      }
    };
    socket.on("connect_error", handleConnectError);
    return () => {
      if (socket) {
        // socket.off("new_message", handleNewMessage);
        socket.off("delete_message", handleDeleteMessage);
        socket.off("edit_message", handleEditMessage);
        socket.off("user_status", handleUserStatus);
        socket.off("connect_error", handleConnectError);
      }
    };
  }, [socket, current_conversation]);
  useEffect(() => {
    let chat = [];
    let archive = [];
    const userData = Cookies.get("user");

    if (userData) {
      const parsedData = JSON.parse(userData);
      conversations.forEach((val) => {
        if (val.status.includes(parsedData.userId)) {
          archive.push(val);
        } else {
          chat.push(val);
        }
      });
    }
    setChat(chat);
    setArchive(archive);
  }, [conversations, active]);
  useEffect(() => {
    if (query.trim() === "") {
      setShowSuggestions(false);
      return;
    }

    const debounceTimeout = setTimeout(() => {
      dispatch(fetchUsers({ query, userId, token }))
        .unwrap()
        .then((response) => {})
        .catch((error) => {
          setShowSuggestions(false);
          if (error === "Unauthorized") {
            persistor.purge();
            Cookies.remove("user");

            navigate("/");
          }
        });
      if (guests?.length > 0) {
        setShowSuggestions(true);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [query, dispatch]);
  useEffect(() => {
    setShowSuggestions(guests?.length > 0);
  }, [guests]);

  useEffect(() => {
    const userData = Cookies.get("user");

    if (userData) {
      const parsedData = JSON.parse(userData);
      setUserId(parsedData.userId);
      setToken(parsedData.token);

      dispatch(
        fetchConversations({
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
      store.dispatch({ type: RESET_DIRECT_CHAT });
    };
  }, []);
  const handleSelectUser = (user) => {
    if (user._id === userId) return;
    dispatch(checkConversation(user));
    setQuery("");
    setShowSuggestions(false);
    setModalOpen(false);
  };
  let debounceTimeout;
  const findHandler = (e) => {
    clearTimeout(debounceTimeout);
    if (active === "chat") {
      debounceTimeout = setTimeout(() => {
        const filteredArray = conversations?.filter((item) => {
          let name = `${item.participants[0].firstname.toLowerCase()} ${item.participants[0].lastname.toLowerCase()}`;

          return (
            name.includes(e.target.value.toLowerCase()) &&
            !item.status.includes(userId)
          );
        });

        setChat(filteredArray);
      }, 300);
    } else {
      debounceTimeout = setTimeout(() => {
        const filteredArray = conversations?.filter((item) => {
          let name = `${item.participants[0].firstname.toLowerCase()} ${item.participants[0].lastname.toLowerCase()}`;
          return (
            name.includes(e.target.value.toLowerCase()) &&
            item.status.includes(userId)
          );
        });

        setArchive(filteredArray);
      }, 300);
    }
  };
  const handleClick = (id, selectChatHandler) => {
    const delay = 300;

    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      setShowOptions(id);
    } else {
      clickTimeout.current = setTimeout(() => {
        selectChatHandler(id);
        setShowOptions(false);
        clickTimeout.current = null;
      }, delay);
    }
  };

  // chat and grup setting
  const pathname = useLocation().pathname;

  console.log(pathname);
  const [activePath, setActivePath] = useState(pathname);
  const userData = Cookies.get("user");
  const Navigate = useNavigate();

  return (
    <>
      {/* {modalOpen && (
        <div className="chat_modal_overlay">
          <div className="chat_modal_main_container">
            <div className="chat_modal_input_container">
              <h3>Users</h3>
              <input
                type="text"
                placeholder="Type to search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <AiOutlineCloseCircle
              className="chat_modal_close_button"
              style={{ color: "#6169FF" }}
              onClick={() => (setModalOpen(false),setQuery(""))}
            />
            {showSuggestions && (
              <div className="chat_modal_suggestions_container">
                {guests?.slice(0, 5).map((user, i) => (
                  <div
                    style={
                      i % 2 == 0
                        ? { backgroundColor: "#E2E4FF" }
                        : { backgroundColor: "#ECECEC" }
                    }
                    key={user._id}
                    className="chat_modal_suggestion"
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="modal_image_container">
                      <img src={user.profile?user.profile:profile} alt="profile"/>
                      </div>
                    {user.firstname}  {user.lastname}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )} */}
      {modalOpen && (
        <div
          className={
            deviceType === "mobile"
              ? "group_modal_overlay mobile_modal_main_container"
              : "group_modal_overlay"
          }
        >
          <div className={"group_modal_main_container"}>
            <div className="group_modal_header_container">
              <div className="group_modal_header">
                <FiUsers />
                <h3>Users</h3>
              </div>
              <AiOutlineClose
                className="group_modal_close_button"
                onClick={() => (setModalOpen(false), setQuery(""))}
              />
            </div>

            <div className="group_modal_input_container">
              <h3>Users</h3>

              <input
                type="text"
                placeholder="Type to search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {showSuggestions && (
              <div className="group_modal_suggestions_container">
                {guests?.slice(0, 5).map((user, i) => (
                  <div
                    key={user._id}
                    className="group_modal_suggestion"
                    onClick={() => handleSelectUser(user)}
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
          </div>
        </div>
      )}
      <div
        className="chatlayout"
        style={deviceType === "mobile" ? {} : { width: "100%" }}
      >
        {deviceType === "mobile" ? (
          <>
            {current_conversation !== null ? (
              <div className="selected_chat_container mobile_chat_container">
                <SharedContext.Provider value={{ replyChat, setReplyChat }}>
                  <Header deviceType={deviceType} />
                  <hr />
                  <Chat userId={userId} token={token} deviceType={deviceType} />

                  <Footer token={token} deviceType={deviceType} />
                </SharedContext.Provider>
              </div>
            ) : (
              <div className="chat_message_container mobile_chat_container">
                <div className="chat_heading">
                  <h5>
                    <MdMenu onClick={() => setSideToggle(true)} />
                    Messages
                  </h5>
                  <GoPlusCircle onClick={() => setModalOpen(true)} />
                </div>
                <hr />
                <div className="chat_list_main_container mobile_chat_list_container">
                  <div className="chat_list_button_container">
                    <div
                      className={
                        active === "chat"
                          ? "chat_button button-active"
                          : "chat_button"
                      }
                      onClick={() => {
                        if (active === "chat") return; // Prevent any action if already active
                        setActive("chat"); // Set active state
                        dispatch(setMessagesValue()); // Dispatch Redux action
                        setShowOptions(false); // Update show options state
                      }}
                    >
                      <PiChatCenteredTextLight />
                      Chats
                    </div>
                    <div
                      className={
                        active === "archive"
                          ? "chat_button button-active"
                          : "chat_button"
                      }
                      onClick={() => {
                        if (active === "archive") return;
                        setActive("archive");
                        dispatch(setMessagesValue());
                        setShowOptions(false);
                      }}
                    >
                      <RiInboxArchiveLine />
                      Archived{" "}
                      {archive.length > 0 ? (
                        <span className="archive_length">{archive.length}</span>
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>
                  <div className="search_container">
                    <div className="input_container">
                      <input
                        placeholder="Search by chats"
                        onChange={(e) => findHandler(e)}
                      />
                    </div>
                    <div className="search_conatiner_button">
                      <CiSearch />
                    </div>
                  </div>
                  <div className="chat_list_container">
                    {active === "chat" ? (
                      <>
                        {chat?.map((val, i) => (
                          <Chatlist
                            val={val}
                            key={i}
                            active={active}
                            showOptions={showOptions}
                            handleClick={handleClick}
                            user_id={userId}
                            token={token}
                          />
                        ))}
                      </>
                    ) : (
                      <>
                        {archive?.map((val, i) => (
                          <Chatlist
                            val={val}
                            active={active}
                            showOptions={showOptions}
                            handleClick={handleClick}
                            key={i}
                            user_id={userId}
                            token={token}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-[20vw] h-[100vh] overflow-hidden border-r border-[var(--background-color)] bg-white">
              {/* search bar  & add button*/}
              <div className="flex items-center max-w-sm mx-auto gap-2 relative px-2 mt-4">
                <label for="simple-search" className="sr-only">
                  Search
                </label>
                <div className="relative w-full">
                  <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <Search
                      size={18}
                      className="text-[var(--secondary-font-color)]"
                    />
                  </div>
                  <input
                    type="text"
                    id="simple-search"
                    className="bg-[#F6F5F8] border border-white text-gray-900 text-sm rounded-full block w-full ps-10 p-2 focus:border focus:border-[var(--color-blue)] focus:outline-none"
                    placeholder="Search..."
                    onChange={(e) => findHandler(e)}
                  />
                </div>
                <div className="p-2 bg-[#F6F5F8] rounded-full h-full">
                  <SquarePen
                    onClick={() => setModalOpen(true)}
                    size={18}
                    className="text-[var(--color-blue)]"
                  />
                </div>
              </div>
              {/* active button of the group */}
              <div className="chat_list_main_container">
                {/* buttonfor the archived and chats button */}
                {/* <div
                  className="chat_list_button_container"
                  style={{ border: "1px solid red" }}
                >
                  <div
                    className={
                      active === "chat"
                        ? "chat_button button-active"
                        : "chat_button"
                    }
                    onClick={() => {
                      if (active === "chat") return; // Prevent any action if already active
                      setActive("chat"); // Set active state
                      dispatch(setMessagesValue()); // Dispatch Redux action
                      setShowOptions(false); // Update show options state
                    }}
                  >
                    <PiChatCenteredTextLight />
                    Chats
                  </div>
                  <div
                    className={
                      active === "archive"
                        ? "chat_button button-active"
                        : "chat_button"
                    }
                    onClick={() => {
                      if (active === "archive") return;
                      setActive("archive");
                      dispatch(setMessagesValue());
                      setShowOptions(false);
                    }}
                  >
                    <RiInboxArchiveLine />
                    Archived{" "}
                    {archive.length > 0 ? (
                      <span className="archive_length">{archive.length}</span>
                    ) : (
                      <></>
                    )}
                  </div>
                </div> */}
                {/* button grup for the chats and group chats
                 */}
                <div className="mt-3 flex items-center justify-center w-full p-2">
                  <div className="w-full flex items-center justify-between gap-2 rounded-full bg-[#F6F5F8]">
                    {Navigation.map((navList, index) => (
                      <button
                        onClick={() => {
                          setActivePath(navList.path);
                          Navigate(navList.path);
                        }}
                        className={`p-[6px_20px] rounded-full font-medium ${
                          navList.path === activePath
                            ? "bg-[var(--color-blue)] text-white"
                            : "bg-[#F6F5F8] text-black"
                        }`}
                      >
                        {navList.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* chat list of the container */}
                <div className="chat_list_container p-2">
                  {active === "chat" ? (
                    <>
                      {chat?.map((val, i) => (
                        <Chatlist
                          val={val}
                          key={i}
                          active={active}
                          showOptions={showOptions}
                          handleClick={handleClick}
                          user_id={userId}
                          token={token}
                        />
                      ))}
                    </>
                  ) : (
                    <>
                      {archive?.map((val, i) => (
                        <Chatlist
                          val={val}
                          active={active}
                          showOptions={showOptions}
                          handleClick={handleClick}
                          key={i}
                          user_id={userId}
                          token={token}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
            {current_conversation !== null ? (
              <SharedContext.Provider value={{ replyChat, setReplyChat }}>
                <div className="selected_chat_container">
                  <Header />
                  <hr />
                  <Chat userId={userId} token={token} />

                  <Footer token={token} />
                </div>
              </SharedContext.Provider>
            ) : (
              <div className="noSelected_chat_container">
                <img src={nochat} alt="nochat" />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ChatLayout;

const Navigation = [
  { name: "Chats", path: "/home/chat" },
  { name: "Groups", path: "/home/group" },
  { name: "Admin", path: "home/admin" },
];
