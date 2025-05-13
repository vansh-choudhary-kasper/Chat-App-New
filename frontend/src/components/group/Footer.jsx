import React, { useContext, useEffect, useRef, useState } from "react";
import "./footer.css";
import { IoIosAttach } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import { IoCloseCircleOutline } from "react-icons/io5";
import { GoImage } from "react-icons/go";
import { AiOutlineFilePdf } from "react-icons/ai";
import { HiOutlineVideoCamera } from "react-icons/hi2";
import { AiOutlineFileZip } from "react-icons/ai";

import { useSelector, useDispatch } from "react-redux";
import { socket } from "../../context/context";
import { sendMedia, sendMessage } from "../../redux/slice/messageSlice";
import { v4 as uuidv4 } from 'uuid';
import { persistor, store } from "../../redux/store";
import Cookies from "js-cookie";
import { RESET_STATE } from "../../redux/rootReducers";
import { useNavigate } from "react-router-dom";
const createURL= (file)=>{
  if (!file) {
    console.error("No file provided");
    return null;
  }
  const previewUrl = URL.createObjectURL(file);
  return previewUrl
}
const textMessageReply = (text, setReply) => {
  return (
    <>
      <div className="reply">
        <IoCloseCircleOutline
          className="reply_close"
          onClick={() => setReply(false)}
        />
        <p>ewrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr</p>
      </div>
    </>
  );
};
const imageMessageReply = (preview, setReply) => {

 
  return (
    <div className="reply_image_main_container">
      <IoCloseCircleOutline
        className="reply_image_close"
        onClick={() => setReply(false)}
      />
      <div className="reply_image_container">
        <img src={preview} alt="reply" className="reply_image_content" />
      </div>
    </div>
  );
};
const videoMessage = (preview, setVideo) => {

  return (
    <div className="reply_image_main_container">
      <IoCloseCircleOutline
        className="reply_image_close"
        onClick={() => setVideo(false)}
      />
      <div className="reply_image_container">
        <video controls className="reply_image_content">
          <source src={preview} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};
const pdfMessage = (pdfSrc,fileTypes, setVideo) => {

   return (
     <div className="reply_image_main_container reply_pdf">
       <IoCloseCircleOutline
         className="reply_image_close"
         onClick={() => setVideo(false)}
       />
       <div className="reply_pdf_container">
      {fileTypes==="pdf"? <AiOutlineFilePdf />: <AiOutlineFileZip />} <p>{pdfSrc.name.length>80?pdfSrc.name.splice(0,79):pdfSrc.name}</p>
       </div>
     </div>
   );
 };



function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(
    urlRegex,
    (url) => `<a href="${url}" target="_blank">${url}</a>`
  );
}

function containsUrl(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return urlRegex.test(text);
}

const Footer = () => {
  const dispatch = useDispatch();
  const navigate= useNavigate();
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [preview, setPreview] = useState(null);
 
  const {group_chat:{current_group}} = useSelector((state)=>state.conversation);
 
  useEffect(() => {
    const userData = Cookies.get("user");

    if (userData) {
      const parsedData = JSON.parse(userData);
      setUserId(parsedData.userId);
      setToken(parsedData.token);
    }
  }, []);
  const inputRef = useRef(null)
  const [reply, setReply] = useState(true);
  const [showAttach, setShowAttach] = useState(true);
  const [fileTypes, setFileTypes] = useState(null);
  const [fileValue, setFileValue]=useState(null)
  

  const attachmentHandler = () => {
    setShowAttach(!showAttach);
  };
  const handleFileSelect = (fileType) => {
    const input = document.createElement("input");
    input.type = "file";

    switch (fileType) {
      case "image":
        input.accept = "image/*";
        break;
      case "pdf":
        input.accept = "application/pdf";
        break;
      case "zip":
        input.accept = ".zip,.rar";
        break;
      case "video":
        input.accept = "video/*";
        break;
      default:
        break;
    }

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setFileValue(file)
        setFileTypes(fileType)
        setPreview(URL.createObjectURL(file))
      }
    };

    input.click();
    setShowAttach(true)
  };
  const sendHandler = (e) => {

  if(e.key ==="Enter" || e.type==="click") {
    let msg = inputRef.current.value;
   
    if (msg && msg.trim() && fileTypes) {
    let  date=new Date()
      const msgId=  uuidv4();
      const formData = new FormData();
      formData.append('conversation_id', current_group._id);
      formData.append('from', userId);
      formData.append('conversation', "group");
 
      formData.append('type', fileTypes);
      formData.append('file', fileValue);
      formData.append('msgId', msgId);
      formData.append('loading', true);
    // if(fileTypes==="zip"||fileTypes==="pdf" ||fileTypes==="image"){
      formData.append('filename', fileValue.name);
    // }
      formData.append('text', (fileTypes==="zip"||fileTypes==="pdf"||fileTypes==="image"||fileTypes==="video")?"null": msg.trim());
      const obj = {
        conversation_id: current_group._id,
        from: userId,
        conversation:"group",
        type:fileTypes,
        file:fileValue,
        filename: fileValue.name,
        text:(fileTypes==="zip"||fileTypes==="pdf"||fileTypes==="image"||fileTypes==="video")?"null": msg.trim(),
        msgId,
        loading:true,
        created_at: date.toISOString()
      }
      dispatch(sendMedia({ formData, obj ,token})).unwrap().then(()=>{

      }).catch(()=>{
        store.dispatch({ type: RESET_STATE});
        persistor.purge();
        Cookies.remove("user");
        navigate("/")
      });;
      inputRef.current.value=null
      setFileTypes(null)
      setFileValue(null)
      // socket.emit("text_message", obj);
    } else if (msg && msg.trim()) {
      const obj = {
        message: msg.trim(),
        conversation_id: current_group._id,
        from: userId,
        conversation:"group",
        type: containsUrl(msg) ? "link" : "text",
      };
      console.log(socket)
      socket.emit("text_message", obj);
       inputRef.current.value=null
   
    } else if (fileTypes) {
      const msgId=  uuidv4();
      let  date=new Date();
   
      const formData = new FormData();
      formData.append('conversation_id', current_group._id);
      formData.append('from', userId);
      formData.append('conversation', "group");
   
      formData.append('type', fileTypes);
      formData.append('file', fileValue);
      formData.append('msgId', msgId);
      formData.append('loading', true);
    // if(fileTypes==="zip"||fileTypes==="pdf"||fileTypes==="image"){
      formData.append('filename', fileValue.name);
    // }
    const obj = {
      conversation_id: current_group._id,
      from: userId,
      conversation:"group",
      type:fileTypes,
      file:fileValue,
      filename: fileValue.name,
      text: "null",
      msgId,
      created_at: date.toISOString(),
      loading:true
    }
      formData.append('text', null);
    
      dispatch(sendMedia({ formData, obj,token})).unwrap().then(()=>{

      }).catch(()=>{
        store.dispatch({ type: RESET_STATE});
        persistor.purge();
        Cookies.remove("user");
        navigate("/")
      });
     
      setFileTypes(null)
      setFileValue(null)

  };
  }else{
    return;
  }
  

}
const removeHandler =()=>{
setFileTypes(null)
setFileValue(null)
}

  return (
    <div className="footer_main_container">
       {/* {reply ? textMessageReply("rtrrt", setReply) : imageMessageReply(profile,setReply)} */}
       {fileTypes==="video" &&  videoMessage(preview,removeHandler)}
       {fileTypes==="image" &&  imageMessageReply(preview,removeHandler)}
       {(fileTypes==="pdf" || fileTypes==="zip") && pdfMessage(fileValue,fileTypes,removeHandler)}
      <div className="footer_container">
        <div className="footer_icon">
          <IoIosAttach onClick={attachmentHandler} /> 
          <div className={showAttach ? "footer_icon_child hidden" : "footer_icon_child"}>
            <div className="footer_select_icon" onClick={() => handleFileSelect("image")}>
              <GoImage />
            </div>
            <div className="footer_select_icon" onClick={() => handleFileSelect("pdf")}>
              <AiOutlineFilePdf />
            </div>
            <div className="footer_select_icon" onClick={() => handleFileSelect("zip")}>
              <AiOutlineFileZip />
            </div>
            <div className="footer_select_icon" onClick={() => handleFileSelect("video")}>
              <HiOutlineVideoCamera />
            </div>
          </div>
        </div>
        <div className="footer_input">
          <input placeholder="Send messages" disabled={fileTypes==="zip"||fileTypes==="pdf"?true:false} ref={inputRef} onKeyDown={sendHandler}/>
        
        </div>
        <div className="footer_send_icon">
          <IoSend onClick={sendHandler}/>
        </div>
      </div>
    </div>
  );
}

export default Footer;
