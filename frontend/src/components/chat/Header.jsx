import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import "./chatlayout.css";
import { FiPhone } from "react-icons/fi";
import profile from "../../assets/img/manprofile.png";
// import profile from "../../assets/img/profile.jpeg";
import { useDispatch, useSelector } from "react-redux";
import VideoCallModal from "./VideoCallModal";
import { socket } from "../../context/context";
import { v4 as uuidv4 } from "uuid";
import errorTune from "../../assets/tunes/error.mp3";
// import callTune from "../../assets/tunes/incomingcall.mp3";
import { FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";
import { IoIosArrowBack } from "react-icons/io";
import ContactInfo from "../contact/ContactInfo";
import { AiOutlineConsoleSql } from "react-icons/ai";
import { setInitial } from "../../redux/slice/messageSlice";

const Header = ({ deviceType }) => {
  const dispatch = useDispatch();
  const [myStream, setMyStream] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVoiceCallModalOpen, setIsVoiceCallModalOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [toUserStatus, setToUserStatus] = useState(null);
  // const [incomingCall, setIncomingCall] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const {
    direct_chat: { current_user },
  } = useSelector((state) => state.conversation);

  const { user } = useSelector((state) => state.guests);
  const playErrorTune = () => {
    const errorAudio = new Audio(errorTune);
    errorAudio.play();
  };
  const incomingTune = () => {
    const callTunes = new Audio("/sound/incomingcall.mp3");
    callTunes.play();
  };

  const toggleVideo = useCallback(() => {
    if (myStream) {
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  }, [myStream, isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  }, [myStream, isAudioEnabled]);

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      // {
      //   urls: "turn:relay1.expressturn.com:3478", // TURN server URL
      //   username: "ef9MSYZ85EEMNS1CAS", // Username for authentication
      //   credential: "pUnwxTF548KOW80Z", // Password for authentication
      // },
    ],
    // iceServers: [
    //   { urls: ['stun:stun.l.google.com:19302', 'stun:bn-turn1.xirsys.com'] },
    //   {
    //     username: "GPGALnFu1elMv2Mjo5S9nrZfoZ-MDkfJzSPq-7C99LY5KKn39w6EZvpK5y_7ZkBaAAAAAGgUdaZ2YW5zaGNob3VkaGF5",
    //     credential: "f5c15896-2727-11f0-a058-0242ac140004",
    //     urls: ["turn:bn-turn1.xirsys.com:80?transport=udp", "turn:bn-turn1.xirsys.com:3478?transport=udp", "turn:bn-turn1.xirsys.com:80?transport=tcp", "turn:bn-turn1.xirsys.com:3478?transport=tcp", "turns:bn-turn1.xirsys.com:443?transport=tcp", "turns:bn-turn1.xirsys.com:5349?transport=tcp"]
    //   }
    // ]
  };
  const iceCandidateBuffer = [];

  const processBufferedCandidates = () => {
    if (peerConnectionRef.current && iceCandidateBuffer.length > 0) {
      iceCandidateBuffer.forEach(async (candidate) => {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      });
      iceCandidateBuffer.length = 0;
    }
  };
  const createPeerConnection = (id) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    localStreamRef.current.getTracks().forEach(async (track) => {
      await peerConnection.addTrack(track, localStreamRef.current);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("video_ice_candidate", {
          to: id,
          candidate: event.candidate,
        });
      }
    };

    processBufferedCandidates();

    return peerConnection;
  };
  const createVoicePeerConnection = (id) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    peerConnection.ontrack = (event) => {
      remoteAudioRef.current.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("audio_ice_candidate", {
          to: id,
          candidate: event.candidate,
        });
      }
    };

    console.log("local stream", localStreamRef.current);

    localStreamRef.current.getTracks().forEach(async (track) => {
      await peerConnection.addTrack(track, localStreamRef.current);
    });

    return peerConnection;
  };
  const joinVoiceRoom = async () => {
    const roomId = uuidv4();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      localStreamRef.current = stream;
      localStreamRef.current.muted = true;
      setMyStream(stream);
      setIsAudioEnabled(true);
      setIsVoiceCallModalOpen(true);
      socket.emit("join-voice-room", {
        to: current_user._id,
        roomId,
        from: user._id,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const joinVideoRoom = async () => {
    const roomId = uuidv4();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      setIsVideoEnabled(true);
      setMyStream(stream);
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
        }
      }, 500);

      socket.emit("join-video-room", { to: current_user._id, roomId });
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    socket.on("user_video_call_status", (data) => {
      if (
        data.status === "not found" ||
        data.status === "Offline" ||
        data.status === "In Call"
      ) {
        playErrorTune();
        setIsVideoEnabled(false);
        setTimeout(() => {
          setIsOfflineModalOpen(true);
          setToUserStatus(data.status);
        }, 300);

        if (myStream) {
          myStream.getTracks().forEach((track) => track.stop());
          setMyStream(null);
        }
      }
    });
    socket.on("room_video_created", async ({ id }) => {
      peerConnectionRef.current = await createPeerConnection(id);
      console.log("peerConnectionRef.current", peerConnectionRef.current);

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(
        new RTCSessionDescription(offer)
      );

      socket.emit("video_call_user", { to: id, offer });
    });
    socket.on("user_voice_call_status", (data) => {
      if (
        data.status === "not found" ||
        data.status === "Offline" ||
        data.status === "In Call"
      ) {
        playErrorTune();
        setIsAudioEnabled(false);

        setIsVoiceCallModalOpen(false);
        setTimeout(() => {
          setIsOfflineModalOpen(true);
          setToUserStatus(data.status);
        }, 300);

        if (myStream) {
          myStream.getTracks().forEach((track) => track.stop());
          setMyStream(null);
        }
      }
    });
    // socket.on("incoming_video_call", async ({ from, offer }) => {
    //   try {
    //     const stream = await navigator.mediaDevices.getUserMedia({
    //       video: true,
    //       audio: true,
    //     });
    //     localStreamRef.current = stream;
    //     setIsVideoEnabled(true);
    //     setMyStream(stream);
    //     setTimeout(() => {
    //       if (localVideoRef.current) {
    //         localVideoRef.current.srcObject = stream;
    //         localVideoRef.current.muted = true;
    //       }
    //     }, 500);

    //     // 1. Create Peer Connection
    //     peerConnectionRef.current = await createPeerConnection(from);

    //     // 2. Set Remote Description
    //     await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));

    //     // 3. Create Answer
    //     const answer = await peerConnectionRef.current.createAnswer();
    //     await peerConnectionRef.current.setLocalDescription(answer);

    //     // 4. Send Answer to Caller
    //     socket.emit("video_call_answered", { to: from, answer });

    //     // 5. Flush Buffered ICE Candidates
    //     processBufferedCandidates();
    //   } catch (error) {
    //     console.error("Error handling incoming video call:", error);
    //   }
    // });

    socket.on("disable_call", (data) => {
      console.log("current_user", current_user._id);
      console.log("data.from", data.from);
      if (current_user._id === data.from) {
        // Stop all tracks
        if (myStream) {
          myStream.getTracks().forEach((track) => track.stop());
          setMyStream(null);
        }

        // Close peer connection
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }

        // Clear video elements
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }

        // Reset state
        setIsVoiceCallModalOpen(false);
        setIsVideoEnabled(false);
      }
    });
    socket.on("video_call_answered", async ({ from, answer }) => {
      console.log("video_call_sockit_answered", answer);
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        ).then(() => {
          console.log("Remote description set successfully");
        }).catch(error => {
          console.error("Error setting remote description:", error);
        });
      }
      console.log("video_call_answered", peerConnectionRef.current);
    });

    socket.on("video_ice_candidate", async ({ from, candidate }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } else {
        console.warn("PeerConnection is not ready. Buffering candidate.");
        iceCandidateBuffer.push(candidate);
      }
    });
    socket.on("room_voice_created", async ({ id }) => {
      peerConnectionRef.current = await createVoicePeerConnection(id);

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit("voice_call_user", { to: id, offer });
    });

    socket.on("voice_call_answered", async ({ from, answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
      }
    });

    socket.on("audio_ice_candidate", async ({ from, candidate }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    });
    return () => {
      if (socket) {
        socket.off("user_call_status");
        socket.off("room_video_created");
        // socket.off("incoming_video_call");
        socket.off("video_call_answered");
        socket.off("video_ice_candidate");
        socket.off("room_voice_created");
        socket.off("incoming_voice_call");
        socket.off("voice_call_answered");
        socket.off("audio_ice_candidate");
      }
    };
  }, [socket, myStream]);

  // const acceptCall = async () => {
  //   if (!incomingCall) return;
  //   const stream = await navigator.mediaDevices.getUserMedia({
  //     video: true,
  //     audio: true,
  //   });
  //   localStreamRef.current = stream;
  //   setIsVideoEnabled(true);
  //   setTimeout(() => {
  //     console.log(localVideoRef.current);
  //     localVideoRef.current.srcObject = stream;
  //   }, 500);
  //   const { from, offer } = incomingCall;
  //   peerConnectionRef.current = createPeerConnection(from);

  //   await peerConnectionRef.current.setRemoteDescription(
  //     new RTCSessionDescription(offer)
  //   );

  //   const answer = await peerConnectionRef.current.createAnswer();
  //   await peerConnectionRef.current.setLocalDescription(
  //     new RTCSessionDescription(answer)
  //   );

  //   socket.emit("answer_video_call", { to: from, answer });

  //   setIncomingCall(null);
  // };

  useEffect(() => {
    console.error("Socket_id = ", socket.id);
  }, [socket, socket.id]);

  const leaveCallHandler = () => {
    socket.emit("leaveCall", { to: current_user._id });

    // Stop all tracks
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset state
    setIsVideoEnabled(false);
    setIsVoiceCallModalOpen(false);
  };
  const backHandler = () => {
    dispatch(setInitial());
  };
  return (
    <>
      {profileModal && (
        <ContactInfo
          setProfileModal={setProfileModal}
          joinVideoRoom={joinVideoRoom}
          joinVoiceRoom={joinVoiceRoom}
          current_user={current_user}
          profile={profile}
        />
      )}
      <div
        className={
          deviceType === "mobile"
            ? "selected_chat_heading mobileHeader_selected"
            : "selected_chat_heading"
        }
      >
        <div className="selected_chat_profile_container">
          {" "}
          <div className="selected_chat_back_container">
            <IoIosArrowBack onClick={backHandler} />
          </div>
          <div
            className="selected_chat_image_container"
            onClick={() => setProfileModal(true)}
          >
            <img
              src={current_user?.profile ? current_user?.profile : profile}
              // src={profile}
              alt="profile"
            />
          </div>
          <div className="selected_chat_name_container">
            <h5>
              {current_user?.firstname} {current_user?.lastname}
            </h5>
            <div className="status_container">
              {current_user?.status && current_user?.status === "Online" ? (
                <>
                  <span className="selected_chat_status"></span>
                  <p>Online</p>
                </>
              ) : (
                <p>Offline</p>
              )}
            </div>
          </div>
        </div>
        <div className="call_container">
          <div className="audio_call" onClick={joinVideoRoom}>
            <FiVideo />
          </div>
          <div className="audio_call" onClick={joinVoiceRoom}>
            <FiPhone />
          </div>
        </div>
      </div>

      {/* {incomingCall && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Incoming video Call</h2>
            <p> is calling...</p>
            <div className="modal-buttons">
              <button className="accept-btn" onClick={acceptCall}>
                Accept
              </button>
              <button className="reject-btn">Reject</button>
            </div>
          </div>
        </div>
      )} */}

      {isVoiceCallModalOpen && (
        <div className="voice-call-modal">
          <audio ref={remoteAudioRef} autoPlay />
          <div className="modal-controls">
            <button
              onClick={() => (
                toggleAudio(), setIsAudioEnabled(!isAudioEnabled)
              )}
            >
              {isAudioEnabled ? <FiMic /> : <FiMicOff />}
            </button>
            <button onClick={leaveCallHandler}>End Call</button>
          </div>
        </div>
      )}
      {isOfflineModalOpen && (
        <div className="offline-modal-overlay">
          <div className="offline-modal-content">
            <h3 className="modal-title">Oops!</h3>
            <p className="modal-message">User is {toUserStatus}</p>
            <div className="modal-controls">
              <button
                className="close-modal-button"
                onClick={() => setIsOfflineModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isVideoEnabled && (
        <div className="modal_overlay">
          <div className="modal_content">
            <h2>Video Call</h2>
            <div className="video_call_container">
              <div className="video_view video_self_view">
                {isVideoEnabled && (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    width="100%"
                    height="100%"
                    className="my-video"
                  />
                )}
              </div>
              <div className="video_view video_remote_view">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  width="100%"
                  height="100%"
                  className="my-video"
                />
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
                  // sendStreams();
                  setIsVideoOn((prev) => !prev);
                  toggleVideo();
                }}
              >
                {isVideoOn ? <FiVideo /> : <FiVideoOff />}
              </button>
              <button
                className="control_button end_call_button"
                onClick={leaveCallHandler}
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(Header);
