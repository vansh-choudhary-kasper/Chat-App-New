import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { IoIosArrowDown } from "react-icons/io";
import { FaFileAlt } from "react-icons/fa";
import "./mediaPage.css";
import { useSelector } from "react-redux";
import { AiOutlineFilePdf, AiOutlineFileZip } from "react-icons/ai";
import { BsDownload } from "react-icons/bs";

const MediaPage = ({
  openMediaPage,
  handleShowMediaPage,
  mediaMessgaes,
  linkMessages,
  docMessages,
  handleDownload,
}) => {
  const [activeTab, setActiveTab] = useState("Media");
  const {
    direct_chat: { messages },
  } = useSelector((state) => state.conversation);

  return (
    openMediaPage && (
      <div className="media-page">
        <div className="media-header">
          <h3>Shared Messages</h3>
          <div className="cross-icon" onClick={handleShowMediaPage}>
            <IoClose />
          </div>
        </div>
        <hr />
        <div className="media-section">
          <div className="media-type">
            <button
              className={activeTab === "Media" ? "active" : ""}
              onClick={() => setActiveTab("Media")}
            >
              Media
            </button>
            <button
              className={activeTab === "Links" ? "active" : ""}
              onClick={() => setActiveTab("Links")}
            >
              Links
            </button>
            <button
              className={activeTab === "Docs" ? "active" : ""}
              onClick={() => setActiveTab("Docs")}
            >
              Docs
            </button>
          </div>
          {activeTab === "Media" && (
            <div className="media-gallery">
              {activeTab === "Media" &&
                mediaMessgaes
                  .filter((val) => val.type === "image" || val.type === "video")
                  .map((media, index) => (
                    <div
                      key={index}
                      className={`gallery-items ${media.type}`}
                      onClick={() => handleDownload(media.file)}
                    >
                      {media.type === "image" ? (
                        <img src={media.file} alt="Media" />
                      ) : (
                        //   console.log(media)
                        <video
                          src={media.file}
                          alt="Preview"
                          className="video_thumbnail"
                          controls={false}
                          // poster={media.file}
                        />
                      )}
                    </div>
                  ))}
            </div>
          )}
          {activeTab === "Links" && (
            <div className="media_gallery_link">
              {activeTab === "Links" &&
                linkMessages.map((link, index) => (
                  <div
                    className="mediaPage_link_container"
                    style={index === 0 ? { marginTop: 0 } : {}}
                  >
                    <a
                      href={link.text}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mediaPage_link"
                    >
                      {link.text}
                    </a>
                  </div>
                ))}
            </div>
          )}
          {activeTab === "Docs" && (
            <div className="media_gallery_link">
              {activeTab === "Docs" &&
                docMessages.map((doc, index) => {
                  return (
                    <div
                      className="message_pdf_container"
                      style={
                        index === 0
                          ? { marginTop: 0, marginBottom: "1.5vh" }
                          : { marginBottom: "1.5vh" }
                      }
                    >
                      {doc.type === "pdf" ? (
                        <AiOutlineFilePdf className="pdf_icon" />
                      ) : (
                        <AiOutlineFileZip className="pdf_icon" />
                      )}

                      {doc.filename ? (
                        <p className="file_name">
                          {doc.filename.length < 20
                            ? doc.filename
                            : `${doc.filename.slice(0, 20)}...`}
                        </p>
                      ) : (
                        <></>
                      )}
                      <button
                        onClick={() => handleDownload(doc.file, "myfile")}
                        className="pdf_download_button"
                      >
                        <BsDownload />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
          {/* <div className="view-more">
            <p>View more</p>{" "}
            <span>
              <IoIosArrowDown />
            </span>
          </div> */}
        </div>
      </div>
    )
  );
};

export default MediaPage;

/* CSS */
