import React, { useState } from 'react';
import { MdMoreVert } from 'react-icons/md';
import { TbArrowBackUp } from 'react-icons/tb';
import { BsDownload } from "react-icons/bs";
import waaa from "../../assets/img/waaa.jpg";
import man from "../../assets/img/man.webp";

import './replymessage.css';

const replyOptions = (i) => {

  const deleteHandler = () => {};
  return (
    <span className={i === 0 ? 'options first_messages' : 'options '}>
      <p>
        <TbArrowBackUp />
        Reply
      </p>
      <p onClick={deleteHandler}>Delete</p>
    </span>
  );
};

const ReplyMessages = ({ i, changeVisibility, visible }) => {
    const [previewImage, setPreviewImage] = useState(null);

    const handleImageClick = (image) => {
      setPreviewImage(image);
    };
  
    const closePreview = () => {
      setPreviewImage(null);
    };
    const msg =
  " Haha, me neither! I literally had to pause and g gdwid iwq iqgfiq qifgiq ipqfpiq fqpifg pqigfqip fqipf";
    return (
      <>
        <div className={i % 2 === 0 ? "image_message" : " image_message_recieve"}>
          <li className="message_time">12:56pm</li>
          <div className="message_image_main_container">
       
            <div
              className="message_image_container"
             
            >
                
              <img src={man} alt="man" onClick={() => handleImageClick(waaa)} />
              {visible === i ? replyOptions(i) : <></>}
            </div>
            <p>{msg}</p>
          </div>
  
          <MdMoreVert
            onClick={(e) => changeVisibility(e, i)}
            style={{ cursor: "pointer" }}
          />
        </div>
        {previewImage && (
          <div className="preview_modal" onClick={closePreview}>
            <div className="preview_modal_content">
              <img src={previewImage} alt="Preview" className="preview_image" />
              <a
                href={previewImage}
                download="image.jpg"
                className="download_button"
              >
                <BsDownload />
              </a>
            </div>
          </div>
        )}
      </>
    );
};

export default ReplyMessages;
