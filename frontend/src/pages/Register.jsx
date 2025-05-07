import React, { useEffect, useState } from "react";
import "./login.css";
import login from "../assets/img/login.png";
import logo from "../assets/img/logo.png";
import { FaUser } from "react-icons/fa";
import { IoMdLock } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { registerHandler } from "../redux/slice/loginSlice";
import {useDispatch, useSelector} from "react-redux";
import {toast} from"react-toastify";
import * as yup from "yup";
import Cookies from "js-cookie";
import {jwtDecode} from "jwt-decode";
const Register = () => {
  const [showPass, setShowPass] = useState(false);
  const [profile, setProfile] =useState(null)
  const [profileImage, setProfileImage] = useState(null);
  const navigate = useNavigate();
const register = useSelector((state)=> state.user.register, (prev, next) => prev === next );
const loading = useSelector((state)=> state.user.loading );
const error = useSelector((state) => state.user.error);
useEffect(() => {
  const userData = Cookies.get("user");

  if (userData) {
    try {
      const parsedData = JSON.parse(userData);
      const token = parsedData.token;
      const decodedToken = jwtDecode(token);
     
      if (decodedToken.access === "admin") {
       
      }else{
        navigate("/home/chat");
      }
    } catch (error) {
      console.error("Error decoding token or redirecting:", error);
    }
  }else{
    navigate("/home/chat");
  }
}, [navigate]);
useEffect(() => {
  if (error) {
    toast.error(error);
  } else if (register) {
   toast.success("User created successfully!");
   formik.resetForm();
    
  }
}, [error, register]);

const dispatch = useDispatch();
  const handleRegister = async (value) => {
    const userData = Cookies.get("user");
    const formData = new FormData();
  formData.append("firstname", value.firstname);
  formData.append("lastname", value.lastname);
  formData.append("email", value.email);
  formData.append("password", value.password);
  formData.append("confirmPassword", value.confirmPassword);
  formData.append("file", profile);
  if (userData) {
   
      const parsedData = JSON.parse(userData);
      const token = parsedData.token;
      dispatch(registerHandler({formData,token}))
    }
  
  };



  const validationSchema = yup.object({
    firstname: yup
      .string()
      .required("First Name is required")
      .max(50, "First Name must not exceed 50 characters"),
    lastname: yup
      .string()
      .required("Last Name is required")
      .max(50, "Last Name must not exceed 50 characters"),
    email: yup
      .string()
      .required("Email is required")
      .max(100, "Email must not exceed 100 characters")
      .email("Email is invalid"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(20, "Password must not exceed 20 characters")
      .required("Password is required"),
      confirmPassword: yup
      .string()
      .oneOf([yup.ref("password"), null], "Passwords must match")
      .required("Confirm Password is required"),
  });
  

  const formik = useFormik({
    initialValues: {
    firstname: "",
    lastname:"",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: (values) => {
      handleRegister(values);
    },
  });
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile(file)
      setProfileImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="login_main">
      <div
        className="login_left_container"
        loading="lazy"
        style={{ "--image-url": `url(${login})` }}
      >
        <h4>
          "Join our community,
          <br /> where ideas come alive!"
        </h4>
        <p>
          Create an account to unlock a world of creativity and collaboration.
          Stay updated, share your progress, and connect with a team that
          empowers your vision.
        </p>
      </div>
      <div className="login_right_container">
        <div className="form_container">
          <div className="logo_container">
            <img src={logo} alt="logo" loading="lazy" />
          </div>
          <h5>Register</h5>
          <form onSubmit={formik.handleSubmit} className="form_container_inputs">
  {/* Profile Image */}
  <div className="profile_image_container">
    <label htmlFor="profileImage" className="profile_image_label">
      {profileImage ? (
        <img
          src={profileImage}
          alt="Profile Preview"
          className="profile_image_preview"
        />
      ) : (
        <span>Profile</span>
      )}
    </label>
    <input
      id="profileImage"
      type="file"
      accept="image/*"
      onChange={handleImageChange}
      style={{ display: "none" }}
    />
  </div>

  <div className="form_container_input">
  {/* First Name */}
  <div className="name_input_container">
    {formik.touched.firstname && formik.errors.firstname && (
      <p className="error">{formik.errors.firstname}</p>
    )}
    <input
      name="firstname"
      placeholder="First Name"
      value={formik.values.firstname}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
    />
  </div>

  {/* Last Name */}
  <div className="name_input_container">
    {formik.touched.lastname && formik.errors.lastname && (
      <p className="error">{formik.errors.lastname}</p>
    )}
    <input
      name="lastname"
      placeholder="Last Name"
      value={formik.values.lastname}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
    />
  </div>
</div>


  {/* Email */}
  {formik.touched.email && formik.errors.email && (
    <p className="error">{formik.errors.email}</p>
  )}
  <div className="email_input_container">
    <FaUser />
    <input
      placeholder="Email"
      name="email"
      value={formik.values.email}
      onChange={(e) => formik.setFieldValue('email', e.target.value.toLowerCase())}
      onBlur={formik.handleBlur}
    />
  </div>

  {/* Password */}
  {formik.touched.password && formik.errors.password && (
    <p className="error">{formik.errors.password}</p>
  )}
  <div className="email_input_container">
    <IoMdLock />
    <input
      name="password"
      placeholder="Password"
      type={showPass ? "text" : "password"}
      className="pass"
      value={formik.values.password}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
    />
  </div>

  {/* Confirm Password */}
  {formik.touched.confirmPassword && formik.errors.confirmPassword && (
    <p className="error">{formik.errors.confirmPassword}</p>
  )}
  <div className="email_input_container">
    <IoMdLock />
    <input
      name="confirmPassword"
      placeholder="Confirm Password"
      type={showPass ? "text" : "password"}
      className="pass"
      value={formik.values.confirmPassword}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
    />
  </div>
  <Link to={"/"}>Already have an account? Login</Link>
  <button type="submit" disabled={loading}>
  {loading ? "Signing Up..." : "Register"}
  </button>
</form>

        </div>
      </div>
    </div>
  );
};

export default Register;
