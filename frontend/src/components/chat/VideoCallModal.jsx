import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./videoCallModal.css";

import { FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";
const VideoCallPage = ({
  isOpen,
  sendStreams,
  onClose,
  toggleAudio,

  myStream,
  remoteStream,
}) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  if (!isOpen) return null;
  return (
    <div className="modal_overlay">
      <div className="modal_content">
        <h2>Video Call</h2>
        <div className="video_call_container">
          <div className="video_view video_self_view">
            {myStream && (
              <video
                ref={(video) => {
                  if (video) {
                    video.srcObject = myStream; // Attach the MediaStream
                    video.muted = true; // Mute self-view
                    video.play(); // Start playing
                  }
                }}
                autoPlay
                playsInline
                width="100%"
                height="100%"
                className="my-video"
              />
            )}
          </div>
          <div className="video_view video_remote_view">
            {remoteStream && (
              <video
                ref={(video) => {
                  if (video) {
                    video.srcObject = remoteStream; // Attach the MediaStream
                    video.muted = true; // Mute self-view
                    video.play(); // Start playing
                  }
                }}
                autoPlay
                playsInline
                width="100%"
                height="100%"
                className="my-video"
              />
            )}
          </div>
        </div>
        <div className="modal_controls">
          <button
            className={`control_button ${!isMicOn ? "disabled" : ""}`}
            onClick={() => {
              setIsMicOn((prev) => !prev);
              toggleAudio();
            }}
          >
            {isMicOn ? <FiMic /> : <FiMicOff />}
          </button>
          <button
            className={`control_button ${!isVideoOn ? "disabled" : ""}`}
            onClick={() => {
              sendStreams();
              // setIsVideoOn((prev) => !prev);
              // toggleVideo();
            }}
          >
            {isVideoOn ? <FiVideo /> : <FiVideoOff />}
          </button>
          <button className="control_button end_call_button" onClick={onClose}>
            End Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
