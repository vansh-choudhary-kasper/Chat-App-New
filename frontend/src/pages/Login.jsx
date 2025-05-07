import React, { useContext, useEffect, useState } from "react";
import "./login.css";
import loginImg from "../assets/img/login.png";
import logo from "../assets/img/logo.png";
import { FaUser } from "react-icons/fa";
import { IoMdLock } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { loginHandler } from "../redux/slice/loginSlice";
import Cookies from "js-cookie";
import { verifyUser } from "../redux/slice/userSlice";
import { persistor } from "../redux/store";
import { contextData } from "../context/context";
const Login = () => {
  const [showPass, setShowPass] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { connectSocket } = useContext(contextData);
  const login = useSelector((state) => state.user.login);
  const loading = useSelector((state) => state.user.loading);
  const error = useSelector((state) => state.user.error);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    if (login) {
      connectSocket({ user_id: login.userId, token: login.token });
      toast.success("User logged in successfully!");
      formik.resetForm();

      navigate("/home/chat");
    }
  }, [login, error]);
  useEffect(() => {
    const userData = Cookies.get("user");

    if (userData) {
      const parsedData = JSON.parse(userData);

      dispatch(
        verifyUser({
          userid: parsedData.userId,
          token: parsedData.token,
        })
      )
        .unwrap()
        .then(() => {
          navigate("/home/chat");
        })
        .catch(() => {
          persistor.purge();
          Cookies.remove("user");
        });
    }
  }, []);
  const validationSchema = Yup.object({
    email: Yup.string()
      .required("Email is required")
      .email("Please enter a valid email")
      .max(100, "Email must not exceed 100 characters"),
    password: Yup.string()
      .required("Password is required")
      .max(20, "Password must not exceed 20 characters"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: (values) => {
      dispatch(loginHandler(values));
    },
  });

  return (
    <div className="login_main">
      <div
        className="login_left_container"
        loading="lazy"
        style={{ "--image-url": `url(${loginImg})` }}
      >
        <h4>"Welcome back, where creativity meets productivity!"</h4>
        <p>
          Log in to access your personalized workspace and stay connected with
          your tasks, team, and progress. Everything you need is just a click
          away.
        </p>
      </div>
      <div className="login_right_container">
        <div className="form_container">
          <div className="logo_container">
            <img src={logo} alt="logo" loading="lazy" />
          </div>
          <h5>Login</h5>
          <form
            className="form_container_inputs"
            onSubmit={formik.handleSubmit}
          >
            {/* Email Input */}
            {formik.touched.email && formik.errors.email && (
              <p className="error">{formik.errors.email}</p>
            )}
            <div className="email_input_container">
              <FaUser />
              <input
                placeholder="Email"
                name="email"
                value={formik.values.email}
                onChange={(e) =>
                  formik.setFieldValue("email", e.target.value.toLowerCase())
                }
                onBlur={formik.handleBlur}
              />
            </div>

            {/* Password Input */}
            {formik.touched.password && formik.errors.password && (
              <p className="error">{formik.errors.password}</p>
            )}
            <div className="email_input_container">
              <IoMdLock />
              <input
                placeholder="Password"
                type={showPass ? "text" : "password"}
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="pass"
              />
            </div>

            <Link to="/forgot-password">Forgot Password?</Link>
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
