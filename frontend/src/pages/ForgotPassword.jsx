import React, { useState, useRef } from 'react';
import './login.css';
import login from "../assets/img/forgot.png";
import logo from "../assets/img/logo.png";
import { FaUser } from "react-icons/fa";
import { IoMdLock } from "react-icons/io";
import { Link, useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import { useDispatch } from 'react-redux';
import { forgotHandler, otpHandler } from '../redux/slice/loginSlice';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [code, setCode] = useState(["", "", "", ""]);
  const inputs = useRef([]);
  const dispatch = useDispatch();
const navigate=useNavigate()
  const handleSend = () => {
    if (!email.trim()) {
      alert("Please enter a valid email address.");
      return;
    }
 
    dispatch(forgotHandler(email)).unwrap().then(() => {
     
      setStep(2);
    }).catch((err) => {
      toast.error(err);
    });
  };

  const handleInputChange = (value, index) => {
    if (!/^\d$/.test(value) && value !== "") return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < inputs.current.length - 1) {
      inputs.current[index + 1].focus();
    }
  };

  const handleVerify = (values) => {
    if (code.some((digit) => digit === "")) {
      toast.error("Please fill in all 4 digits.");
      return;
    }
    const {password, confirmPassword} =values;

    const verificationCode = code.join("");
    dispatch(otpHandler({ verificationCode, email,password,confirmPassword })).unwrap().then(()=>{
      toast.success("Passwword change successful!");
      setCode(["", "", "", ""]);
      navigate("/")
    }).catch(()=>{
      toast.error("Please fill in all 4 digits.");
    });
 
  };

  return (
    <div className='login_main'>
      <div className='login_left_container' style={{ "--image-url": `url(${login})` }}>
        <h4>
          "Forgot Your Password? We've<br /> Got You Covered!"
        </h4>
        <p>
          "Don’t worry if you can’t remember your password. Simply enter your email,<br />
          and we’ll send you a link to reset it in just a few steps. Your security is our<br />
          priority, and we’re here to help you regain access quickly and safely!"
        </p>
      </div>
      <div className='login_right_container'>
        <div className='form_container'>
          <div className='logo_container'>
            <img src={logo} alt='logo' loading="lazy" />
          </div>

          {step === 1 ? (
            <>
              <h5 style={{ textAlign: "center" }}>Forget your Password?</h5>
              <div className='form_container_inputs'>
                <p className="formpara">
                  Please enter the email address associated with your account, and we will email you a link to reset your password.
                </p>
                <div className='email_input_container'>
                  <FaUser />
                  <input
                    type="email"
                    placeholder='Email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Link to={"/"}><span></span>Back to Login? </Link>
              </div>
              <button onClick={handleSend}>Send</button>
            </>
          ) : (
            <Formik
              initialValues={{ password: '', confirmPassword: '' }}
              validationSchema={Yup.object({
                password: Yup.string()
                  .required('Password is required')
                  .min(6, 'Password must be at least 6 characters long'),
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref('password'), null], 'Passwords must match')
                  .required('Confirm Password is required'),
              })}
              onSubmit={(values,{resetForm}) => {
               
                handleVerify(values);
                resetForm();
                // Add code to handle form submission, e.g., API call
              }}
            >
              <Form>
                <h5 style={{ textAlign: "center" }}>Enter the Verification Code</h5>
                <div className='form_container_inputs'>
                  <p className="formpara">
                    A 4-digit code has been sent to your email. Please enter the code below to verify your account.
                  </p>
                  <div className='code_input_container'>
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleInputChange(e.target.value, index)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !code[index] && index > 0) {
                            inputs.current[index - 1].focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className='password_input_container'>
                  <label htmlFor="password">Password</label>
                  <ErrorMessage name="password" component="div" className="error" />
                  <Field type="password" name="password" id="password" />
                 

                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <ErrorMessage name="confirmPassword" component="div" className="error" />
                  <Field type="password" name="confirmPassword" id="confirmPassword" />
               
                </div>
                <button type="submit">Submit</button>
              </Form>
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
