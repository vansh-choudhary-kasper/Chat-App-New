import React, { useContext, useEffect, useState } from "react";
import { AiOutlineMessage } from "react-icons/ai";
import { CiLogout, CiUser } from "react-icons/ci";
import { GrUserNew } from "react-icons/gr";
import { RiGroupLine } from "react-icons/ri";
import logo from "../../assets/img/logo.png";
import { useNavigate } from "react-router-dom";
import profile from "../../assets/img/manprofile.png";
import { contextData } from "../../context/context";
import { RiCloseLine } from "react-icons/ri";
import "./sidebar.css";
import { socket } from "../../context/context";

const Sidebar = ({
  active,
  setActive,
  user,
  setShowLogout,
  setShowLogoutConfirm,
  modalRef,
  showLogout,
  profileHandler,
}) => {
  const navigate = useNavigate();
  const { deviceType, sideToggle, setSideToggle } = useContext(contextData);
  return deviceType === "mobile" ? (
    <div
      className={
        sideToggle
          ? "sideLink mobileSideBarOpen"
          : "sideLink mobileSideBarClose"
      }
    >
      <div className="sidelink_conatiner">
        <div className="sideLink_logo">
          {/* <img src={logo} alt="logo" /> */}
          <RiCloseLine
            className="closingToggle"
            onClick={() => setSideToggle(false)}
          />
        </div>
        <hr />
        <div className="sideLink_icons_container">
          <div
            className={
              active === "chat" ? "sideLink_icons active" : "sideLink_icons "
            }
            onClick={() => (setActive("chat"), navigate("/home/chat"))}
          >
            <AiOutlineMessage />
          </div>
          <div
            className={
              active === "group" ? "sideLink_icons active" : "sideLink_icons "
            }
            onClick={() => (setActive("group"), navigate("/home/group"))}
          >
            <RiGroupLine />
          </div>
          {/* <div className={active==="call"?'sideLink_icons active':'sideLink_icons'} onClick={()=>setActive("call")}>
            <FiPhone/>
        </div> */}
          {user?.access === "admin" ? (
            <>
              <div
                className={
                  active === "user" ? "sideLink_icons active" : "sideLink_icons"
                }
                onClick={() => (setActive("user"), navigate("/register"))}
              >
                <GrUserNew />
              </div>
              <div
                className={
                  active === "admin" ? "sideLink_icons active" : "sideLink_icons"
                }
                onClick={() => (setActive("admin"), navigate("/home/admin"))}
                title="Admin Panel"
              >
                {/* You can use an icon here, for example a shield or settings icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="sideLink_icons_svg"
                  style={{ width: "24px", height: "24px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M7.757 16.243l-2.121 2.121m12.728 0l-2.121-2.121M7.757 7.757L5.636 5.636"
                  />
                </svg>
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
      <div
        className="home_profile_container"
        onClick={() => setShowLogout(!showLogout)}
      >
        <img src={user?.profile ? user.profile : profile} alt="profile" />
      </div>
      {showLogout && (
        <div className="logout_menu" ref={modalRef}>
          <button className="bac" onClick={profileHandler}>
            <CiUser />
            Profile
          </button>
          <button onClick={() => setShowLogoutConfirm(true)}>
            <CiLogout />
            Logout
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className={"sideLink"}>
      <div className="sidelink_conatiner">
        <div className="sideLink_logo">
          <img src={logo} alt="logo" />
        </div>
        <hr />
        <div className="sideLink_icons_container">
          <div
            className={
              active === "chat" ? "sideLink_icons active" : "sideLink_icons "
            }
            onClick={() => (setActive("chat"), navigate("/home/chat"))}
          >
            <AiOutlineMessage />
          </div>
          <div
            className={
              active === "group" ? "sideLink_icons active" : "sideLink_icons "
            }
            onClick={() => (setActive("group"), navigate("/home/group"))}
          >
            <RiGroupLine />
          </div>
          {/* <div className={active==="call"?'sideLink_icons active':'sideLink_icons'} onClick={()=>setActive("call")}>
                <FiPhone/>
            </div> */}
          {user?.access === "admin" ? (
            <>
              <div
                className={
                  active === "user" ? "sideLink_icons active" : "sideLink_icons"
                }
                onClick={() => (setActive("user"), navigate("/register"))}
              >
                <GrUserNew />
              </div>
              <div
                className={
                  active === "admin" ? "sideLink_icons active" : "sideLink_icons"
                }
                onClick={() => (setActive("admin"), navigate("/home/admin"))}
                title="Admin Panel"
              >
                {/* You can use an icon here, for example a shield or settings icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="sideLink_icons_svg"
                  style={{ width: "24px", height: "24px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M7.757 16.243l-2.121 2.121m12.728 0l-2.121-2.121M7.757 7.757L5.636 5.636"
                  />
                </svg>
              </div>
            </> ) : (
            <></>
          )}
        </div>
      </div>
      <div
        className="home_profile_container"
        onClick={() => setShowLogout(!showLogout)}
      >
        <img src={user?.profile ? user.profile : profile} alt="profile" />
      </div>
      {showLogout && (
        <div className="logout_menu" ref={modalRef}>
          <button className="bac" onClick={profileHandler}>
            <CiUser />
            Profile
          </button>
          <button onClick={() => setShowLogoutConfirm(true)}>
            <CiLogout />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
