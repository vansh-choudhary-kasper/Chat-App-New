import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import Cookies from "js-cookie";
import { Base_Url } from "../utils/config";
export const  contextData = createContext();
export let socket;
export const ContextProvider = ({ children }) => {
  let user_id;
  let token;
  let userData = Cookies.get("user");
  let parsedData;
  const [deviceType, setDeviceType] = useState(
    window.innerWidth < 768 ? "mobile" : "web"
  );
  const [sideToggle, setSideToggle] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [existingCalls, setExistingCalls] = useState([]);
  if (userData) {
    parsedData = JSON.parse(userData);
    user_id = parsedData.userId;
    token = parsedData.token;
  }
  const connectSocket = ({ user_id, token }) => {
    socket = io(Base_Url, {
      query: {
        user_id,
      },
      auth: {
        token,
      },
      withCredentials: true,
    });
  };
  useEffect(() => {
    let userData = Cookies.get("user");
    if (userData) {
      if (parsedData) {
        user_id = parsedData.userId;
        token = parsedData.token;
        connectSocket({ user_id, token });
      }
    }
  }, [userData]);

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(window.innerWidth < 600 ? "mobile" : "web");
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <contextData.Provider
      value={{
        socket,
        userData,
        user_id,
        connectSocket,
        deviceType,
        sideToggle,
        setSideToggle,
        showIncomingCall,
        setShowIncomingCall,
        existingCalls,
        setExistingCalls,
      }}
    >
      {children}
    </contextData.Provider>
  );
};
