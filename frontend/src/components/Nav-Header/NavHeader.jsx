import React from "react";
import { useState } from "react";
import { Menu, X, Search } from "lucide";
import { BellIcon } from "lucid";
import logo from "../../assets/img/munclogotm.d7c2a7e6 1.svg";
import { useSelector } from "react-redux";
import { Bell, CircleUserRound, EllipsisVertical } from "lucide-react";
import { use } from "react";
/* Rectangle 77 */

const NavHeader = ({
  user,
  setShowLogout,
  setShowLogoutConfirm,
  modalRef,
  showLogout,
  profileHandler,
}) => {
  return (
    <header class="relative h-[60px] w-full bg-[#FAFAFA] flex items-center justify-between shadow p-2">
      <div class="flex shrink-0 items-center">
        <img class="ml-0  w-auto" src={logo} alt="MUNC" />
      </div>

      <div class="flex items-center space-x-4 pl">
        <button
          type="button"
          class="relative rounded-fullp-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden"
        >
          <span class="absolute -inset-1.5"></span>
          <span class="sr-only">View notifications</span>
          <Bell className="text-[var(--color-blue)]" />
        </button>

        <div className="flex gap-2 items-center ">
          {/* user profile  */}
          <div class="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
            {user?.profile ? (
              <img src={user.profile} alt="profile image" />
            ) : (
              <span class="font-medium text-[var(--color-blue)] dark:text-gray-300 uppercase">
                {`${user?.firstname[0] + user?.lastname[0]}`}
              </span>
            )}
          </div>
          {/* user name email */}
          <div className="flex flex-col leading-5">
            <span className="font-medium text-[var(--primary-font-color)] text-[14px]">{`${user?.firstname} ${user?.lastname}`}</span>
            <span className="font-medium text-[var(--secondary-font-color)] text-sm">{`${user?.status}`}</span>
          </div>

          {/* acces button */}
          <EllipsisVertical
            className="text-[var(--primary-font-color)] cursor-pointer"
            size={18}
            onClick={() => setShowLogout(!showLogout)}
          />
        </div>

        {showLogout && (
          <div
            ref={modalRef}
            class="absolute top-[55px] right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
            tabindex="-1"
          >
            <a
              href="#"
              class="block px-4 py-2 text-sm text-gray-700"
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-0"
            >
              Your Profile
            </a>
            <a
              href="#"
              class="block px-4 py-2 text-sm text-gray-700"
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1"
            >
              Settings
            </a>
            <a
              onClick={() => setShowLogoutConfirm(true)}
              href="#"
              class="block px-4 py-2 text-sm text-gray-700"
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-2"
            >
              Sign out
            </a>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavHeader;
