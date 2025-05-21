import Cookies from "js-cookie";
// import { persistor } from "../redux/store";
// import { RESET_STATE } from "../redux/rootReducers";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";

import { logoutHandler } from "../redux/slice/loginSlice";
import axios from "axios";


const LogoutUser = () => {
    try {
        const userData = Cookies.get("user");
        if (userData) {
            try {
                console.log("logout success");
                Cookies.remove("user");
                localStorage.clear();
                sessionStorage.clear();
                window.location = "/";
                alert("Logged on another device, please log in again");
            } catch (error) {
                alert("Error logging out -> " + error);
            };
        }
    } catch (error) {
        console.log("error = ", error);
    }
};

axios.interceptors.response.use(
    response => response,
    async error => {
        if (
            error.response?.status === 401 &&
            error.response?.data?.message?.toLowerCase().includes("token")
        ) {
            try {
                LogoutUser();
            } catch (error) {
                console.warn("Error logging out:", error);
            }
        }
        return Promise.reject(error);
    }
);

export { axios };