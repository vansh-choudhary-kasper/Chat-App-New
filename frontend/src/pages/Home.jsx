import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Outlet, useLocation } from "react-router-dom";
import "./home.css";
import profile from "../assets/img/manprofile.png";
import { CiUser } from "react-icons/ci";
import logo from "../assets/img/logo.png";
import { AiOutlineMessage } from "react-icons/ai";
import { FiPhone } from "react-icons/fi";
import { RiGroupLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { persistor } from "../redux/store";
import { CiLogout } from "react-icons/ci";
import { logoutHandler } from "../redux/slice/loginSlice";
import { store } from "../redux/store";
import { fetchCurrentUser } from "../redux/slice/userSlice";
import { GrUserNew } from "react-icons/gr";
import { useDispatch, useSelector } from "react-redux";
import { contextData, socket } from "../context/context";
import { FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";
import * as mediasoupClient from "mediasoup-client";

import { RESET_STATE } from "../redux/rootReducers";
import SelfProfile from "../components/contact/SelfProdile";
import Sidebar from "../components/sidebar/Sidebar";
import { sendMessage } from "../redux/slice/messageSlice";
const Home = () => {
  const {
    group_chat: { current_group },
  } = useSelector((state) => state.conversation);
  const pathname = useLocation().pathname.split("/")[2];
  const audioRef = useRef(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [remoteVideos, setRemoteVideos] = useState([]);
  const [profileToggle, setProfileToggle] = useState(false);
  const [incomingVoiceCall, setIncomingVoiceCall] = useState(null);
  const [isVoiceCallModalOpen, setIsVoiceCallModalOpen] = useState(false);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [myStream, setMyStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [active, setActive] = useState(pathname);
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const dispatch = useDispatch();
  const [showLogout, setShowLogout] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const { showIncomingCall, setShowIncomingCall, existingCalls, setExistingCalls } = useContext(contextData);
  
  let rtpCapabilities;
  let device = useRef(undefined);
  const remoteAudioRef = useRef(null);

  let producerTransport;
  let consumerTransports = [];
  let audioProducer;
  let videoProducer;
  let params = {
    // mediasoup params
    encodings: [
      {
        rid: "r0",
        maxBitrate: 100000,
        scalabilityMode: "S1T3",
      },
      {
        rid: "r1",
        maxBitrate: 300000,
        scalabilityMode: "S1T3",
      },
      {
        rid: "r2",
        maxBitrate: 900000,
        scalabilityMode: "S1T3",
      },
    ],
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
    codecOptions: {
      videoGoogleStartBitrate: 1000,
    },
  };

  useEffect(() => {
    console.log("current_group.meetingRooms => ", current_group);
    if(current_group && current_group.meetingRooms) {
      setExistingCalls(current_group.meetingRooms);
    }
  }, [current_group]);

  useEffect(() => {
    if(showIncomingCall) {
      setIncomingCall((prev) => {
        if(prev && prev !== null) {
          return prev;
        }
        return existingCalls.length > 0 ? { roomName: existingCalls[existingCalls.length - 1].meetingRoomId } : null
      });
    }
  }, [showIncomingCall]);

  let audioParams;
  let videoParams = { params };
  let consumingTransports = [];
  let callTunes = new Audio("/sound/incomingcall.mp3");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const user = useSelector((state) => state.guests.user);
  const connectRecvTransport = async (
    consumerTransport,
    remoteProducerId,
    serverConsumerTransportId
  ) => {
    await socket.emit(
      "consume",
      {
        rtpCapabilities: device.current.rtpCapabilities,
        remoteProducerId,
        serverConsumerTransportId,
      },
      async ({ params }) => {
        if (params.error) {
          console.log("Cannot Consume");
          return;
        }

        const consumer = await consumerTransport.consume({
          id: params.id,
          producerId: params.producerId,
          kind: params.kind,
          rtpParameters: params.rtpParameters,
        });

        consumerTransports = [
          ...consumerTransports,
          {
            consumerTransport,
            serverConsumerTransportId: params.id,
            producerId: remoteProducerId,
            consumer,
          },
        ];
        
        setRemoteVideos((prev) => {
          const existingIds = new Set(prev.map((video) => video.id));
          const filteredRemoteVideos = prev.filter((video) => {
            if (existingIds.has(video.id) && video.id !== remoteProducerId) {
              existingIds.delete(video.id);
              return true;
            }
            return false;
          });
          return [
            ...filteredRemoteVideos,
            {
              id: remoteProducerId,
              stream: new MediaStream([consumer.track]),
              kind: consumer.kind,
            },
          ];
        });

        socket.emit("consumer-resume", {
          serverConsumerId: params.serverConsumerId,
        });
      }
    );
  };
  const signalNewConsumerTransport = async (remoteProducerId) => {
    console.error("new running.................");
    if (consumingTransports.includes(remoteProducerId)) return;
    consumingTransports.push(remoteProducerId);

    await socket.emit(
      "createWebRtcTransport",
      { consumer: true },
      ({ params }) => {
        if (params.error) {
          console.log(params.error);
          return;
        }

        let consumerTransport;
        try {
          consumerTransport = device.current.createRecvTransport(params);
        } catch (error) {
          console.log(error);
          return;
        }

        consumerTransport.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            try {
              await socket.emit("transport-recv-connect", {
                dtlsParameters,
                serverConsumerTransportId: params.id,
              });

              callback();
            } catch (error) {
              errback(error);
            }
          }
        );

        connectRecvTransport(consumerTransport, remoteProducerId, params.id);
      }
    );
  };
  const getProducers = () => {
    socket.emit("getProducers", (producerIds) => {
      producerIds.forEach(signalNewConsumerTransport);
    });
  };
  const ICE_SERVERS = {
    // iceServers: [
    //   { urls: "stun:stun.l.google.com:19302" },
    //   { urls: "stun:stun1.l.google.com:19302" },
    //   // {
    //   //   urls: "turn:relay1.expressturn.com:3478", // TURN server URL
    //   //   username: "ef9MSYZ85EEMNS1CAS", // Username for authentication
    //   //   credential: "pUnwxTF548KOW80Z", // Password for authentication
    //   // },
    // ],
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:bn-turn1.xirsys.com'] },
      {
        username: "GPGALnFu1elMv2Mjo5S9nrZfoZ-MDkfJzSPq-7C99LY5KKn39w6EZvpK5y_7ZkBaAAAAAGgUdaZ2YW5zaGNob3VkaGF5",
        credential: "f5c15896-2727-11f0-a058-0242ac140004",
        urls: ["turn:bn-turn1.xirsys.com:80?transport=udp", "turn:bn-turn1.xirsys.com:3478?transport=udp", "turn:bn-turn1.xirsys.com:80?transport=tcp", "turn:bn-turn1.xirsys.com:3478?transport=tcp", "turns:bn-turn1.xirsys.com:443?transport=tcp", "turns:bn-turn1.xirsys.com:5349?transport=tcp"]
      }
    ]
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
  }, [myStream]);
  useEffect(() => {
    const userData = Cookies.get("user");
    if (!userData) {
      persistor.purge();
      navigate("/");
    } else {
      const parsedData = JSON.parse(userData);
      dispatch(
        fetchCurrentUser({ token: parsedData.token, userId: parsedData.userId })
      );
    }
  }, []);
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        showLogout &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        setShowLogout(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showLogout]);
  const logoutUser = () => {
    const userData = Cookies.get("user");
    if (userData) {
      const parsedData = JSON.parse(userData);
      dispatch(logoutHandler(parsedData.userId))
        .unwrap()
        .then(async () => {
          Cookies.remove("user");
          localStorage.clear();
          sessionStorage.clear();
          await persistor.purge();
          store.dispatch({ type: RESET_STATE });

          setShowLogoutConfirm(false);

          navigate("/");
        })
        .catch(() => {
          setShowLogoutConfirm(false);
          alert("Error");
        });
    }
  };
  const createPeerConnection = (id) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("video_ice_candidate", {
          to: id,
          candidate: event.candidate,
        });
      }
    };

    localStreamRef.current.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current);
    });

    processBufferedCandidates();

    return peerConnection;
  };

  const playErrorTune = () => {
    const errorAudio = new Audio("/sound/incomingcall.mp3");

    errorAudio.play();
  };

  const handleProducerClosed = (remoteProducerId) => {
    setRemoteVideos((prev) =>
      prev.filter((video) => video.id !== remoteProducerId)
    );
  };

  useEffect(() => {
    if (socket) {
      socket.on("incoming_video_call", async ({ from, user_id, offer }) => {
        // if(incomingCall !== null) {
        //   return;
        // }
        // console.log("user = ", user);
        setIncomingCall({ from, user_id, offer });
        setShowIncomingCall(true);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch((error) => {
              console.error("Error playing audio:", error);
            });
          }
        }, 500);
      });

      socket.on("video_ice_candidate", async ({ from, candidate }) => {
        if (peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (err) {
            console.error("Failed to add ICE candidate:", err);
          }
        } else {
          console.warn("PeerConnection is not ready. Buffering candidate.");
          iceCandidateBuffer.push(candidate);
        }
      });

      socket.on("audio_ice_candidate", async ({ to, candidate }) => {
        if (peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (err) {
            console.error("Failed to add ICE candidate:", err);
          }
        } else {
          console.warn("PeerConnection is not ready. Buffering candidate.");
          iceCandidateBuffer.push(candidate);
        }
      });
      socket.on("incoming_group_call", (data) => {
        setIncomingCall(data);
        setShowIncomingCall(true);
        setExistingCalls([...existingCalls, data]);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch((error) => {
              console.error("Error playing audio:", error);
            });
          }
        }, 500);
      });
      socket.on("incoming_voice_call", async ({ from, offer, user_id }) => {
        setIncomingVoiceCall({ from, user_id, offer });
        // setIncomingCall({from, user_id, offer});
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch((error) => {
              console.error("Error playing audio:", error);
            });
          }
        }, 500);
      });
      socket.on("new-producer", ({ producerId }) =>
        signalNewConsumerTransport(producerId)
      );
      socket.on("producer-closed", ({ remoteProducerId }) =>
        handleProducerClosed(remoteProducerId)
      );
      socket.on("disable_call", (data) => {
        try {
        if ((incomingCall && incomingCall.user_id === data.from) || (incomingVoiceCall && incomingVoiceCall.user_id === data.from)) {
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

          // Clear audio elements
          if (localStreamRef.current) {
            localStreamRef.current.srcObject = null;
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
          }
          // Reset state
          setIncomingCall(null);
          setIncomingVoiceCall(null);
          setIsVideoEnabled(false);
          setIsVideoCall(false);
          setIsVoiceCallModalOpen(false);
      }
      } catch (error) {
        console.error("Error in disable_call handler:", error);
      }
      });
    }

    return () => {
      if (socket) {
        socket.off("video_ice_candidate");
        socket.off("audio_ice_candidate");
        socket.off("incoming_video_call");
        socket.off("incoming_group_call");
        socket.off("incoming_voice_call");
        socket.off("disable_call");
        socket.off("new-producer");
        socket.off("producer-closed");
      }
    };
  }, [socket, incomingCall, isVideoCall, incomingVoiceCall]);

  const {
    direct_chat: { conversations, current_conversation },
  } = useSelector((state) => state.conversation);

  // useEffect(() => {
  //   setRemoteVideos((prev) => {
  //     const newVideos = remoteVideos;
  //     const existingIds = new Set(newVideos.map((video) => video.id));
  //     const filteredRemoteVideos = remoteVideos.filter(
  //       (video) => {
  //         if(existingIds.has(video.id)) {
  //           existingIds.delete(video.id);
  //           return true;
  //         }
  //       }
  //     );
  //     return [...filteredRemoteVideos];
  //   });
  // }, []);

  const userData = Cookies.get("user");
  useEffect(() => {
    if (!socket) return; 
    if (!userData) return;

    const parsedData = JSON.parse(userData);

    const handleNewMessage = (data) => {
      if (
        data.conversation_id === current_conversation &&
        data.message.to === parsedData.userId
      ) {
        data.message.seen = "seen";

        socket.emit("chat_seen", {
          conversation_id: data.conversation_id,
          messageId: data.message._id,
          to: data.message.to,
        });
      }

      dispatch(sendMessage({ data, userId: parsedData.userId }));
    };
    socket.on("new_message", handleNewMessage);
    const handleGroupMessage = (data) => {
      dispatch(sendMessage({ data, userId: parsedData.userId }));
    };
    socket.on("group_message", handleGroupMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("group_message", handleGroupMessage);
    };
  }, [userData]);
  useEffect(() => {
    if (incomingCall?.roomName) {
      const timer = setTimeout(() => {
        if (!isVideoCall) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            // setIncomingCall(null);
            setShowIncomingCall(false);
          }
        }
      }, 20000);

      return () => clearTimeout(timer);
    } else if (incomingCall?.from) {
      const timer = setTimeout(() => {
        if (!isVideoEnabled) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIncomingCall(null);
            setShowIncomingCall(false);
          }
        }
      }, 20000);

      return () => clearTimeout(timer);
    } else if (incomingVoiceCall?.from) {
      const timer = setTimeout(() => {
        if (!isVoiceCallModalOpen) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIncomingVoiceCall(null);
          }
        }
      }, 20000);

      return () => clearTimeout(timer);
    }
  }, [
    incomingCall,
    isVideoCall,
    isVideoEnabled,
    isVoiceCallModalOpen,
    incomingVoiceCall,
  ]);
  const createDevice = async () => {
    try {
      device.current = new mediasoupClient.Device();

      await device.current.load({
        routerRtpCapabilities: rtpCapabilities,
      });

      createSendTransport();
    } catch (error) {
      console.log(error);
      if (error.name === "UnsupportedError")
        console.warn("browser not supported");
    }
  };
  const createSendTransport = () => {
    // see server's socket.on('createWebRtcTransport', sender?, ...)
    // this is a call from Producer, so sender = true
    socket.emit("createWebRtcTransport", { consumer: false }, ({ params }) => {
      // The server sends back params needed
      // to create Send Transport on the client side
      if (params.error) {
        return;
      }

      // creates a new WebRTC Transport to send media
      // based on the server's producer transport params
      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
      producerTransport = device.current.createSendTransport(params);

      // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
      // this event is raised when a first call to transport.produce() is made
      // see connectSendTransport() below
      producerTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-connect', ...)
            await socket.emit("transport-connect", {
              dtlsParameters,
            });

            // Tell the transport that parameters were transmitted.
            callback();
          } catch (error) {
            errback(error);
          }
        }
      );

      producerTransport.on("produce", async (parameters, callback, errback) => {
        try {
          // tell the server to create a Producer
          // with the following parameters and produce
          // and expect back a server side producer id
          // see server's socket.on('transport-produce', ...)
          await socket.emit(
            "transport-produce",
            {
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData,
            },
            ({ id, producersExist }) => {
              // Tell the transport that parameters were transmitted and provide it with the
              // server side producer's id.
              callback({ id });

              // if producers exist, then join room
              if (producersExist) getProducers();
            }
          );
        } catch (error) {
          errback(error);
        }
      });

      connectSendTransport();
    });
  };
  const connectSendTransport = async () => {
    audioProducer = await producerTransport.produce(audioParams);
    videoProducer = await producerTransport.produce(videoParams);

    audioProducer.on("trackended", () => { });

    audioProducer.on("transportclose", () => {
      // close audio track
    });

    videoProducer.on("trackended", () => {
      // close video track
    });

    videoProducer.on("transportclose", () => {
      // close video track
    });
  };
  const acceptCall = async () => {
    if (!incomingCall) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (incomingCall.from) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        localStreamRef.current.muted = true;

        setMyStream(stream);
        setIsVideoEnabled(true);
        setTimeout(() => {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
        }, 500);
        const { from, offer } = incomingCall;
        peerConnectionRef.current = await createPeerConnection(from);

        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        // FLUSH buffered candidates here
        processBufferedCandidates();

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(
          new RTCSessionDescription(answer)
        );

        socket.emit("answer_video_call", { to: from, answer });
        // setIncomingCall(null);
      } catch (error) {
        console.log(error);
      }
    } else if (incomingCall.roomName) {
      try {
        navigator.mediaDevices
          .getUserMedia({
            audio: true,
            video: true,
          })
          .then((stream) => {
            // setIncomingCall(null);
            setIsVideoCall(true);
            localVideoRef.current = stream;
            setTimeout(() => {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.muted = true;
            }, 500);
            setMyStream(stream);
            setIsMicOn(true);
            setIsVideoOn(true);
            audioParams = { track: stream.getAudioTracks()[0], ...audioParams };

            videoParams = { track: stream.getVideoTracks()[0], ...videoParams };
            socket.emit(
              "joinGroupCall",
              { roomName: incomingCall.roomName, producer: false },
              (data) => {
                rtpCapabilities = data.rtpCapabilities;
                createDevice();
              }
            );
          })
          .catch((error) => {
            alert("user media not found");
          });
      } catch (error) {
        console.log(error);
      }
    }
  };
  const callTimmer = () => {
    callTunes.play();
    setTimeout(() => {
      setIncomingCall(null);
    }, 20000);
  };
  const rejectCall = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
        if (incomingCall) {
          setIncomingCall(null);
        } else if (incomingVoiceCall) {
          setIncomingVoiceCall(null);
        }
      socket.emit("leaveCall", { to: incomingCall.user_id });
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  };
  const GroupVideoCall = ({ remoteVideos }) => {
    return (
      <>
        {remoteVideos
          .filter((item) => item.kind === "video")
          .map((video) => (
            <VideoComponent key={video.id} video={video} />
          ))}
        {remoteVideos
          .filter((item) => item.kind === "audio")
          .map((audio) => (
            <AudioComponent key={audio.id} audio={audio} />
          ))}   
      </>
    );
  };
  const VideoComponent = ({ video }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      if (videoRef.current && video.stream) {
        videoRef.current.srcObject = video.stream;
      }
    }, [video.stream]);

    return (
      <div className="group-video-call-modal__user-card">
        <video ref={videoRef} autoPlay playsInline className="remote-video" />
      </div>
    );
  };
  const AudioComponent = ({ audio }) => {
    const audioRef = useRef(null);

    useEffect(() => {
      if (audioRef.current && audio.stream) {
        audioRef.current.srcObject = audio.stream;
      }
    }, [audio.stream]);

    return (
      <audio ref={audioRef} autoPlay playsInline/>
    );
  };
  const profileHandler = () => {
    setProfileToggle(true);
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

    localStreamRef.current.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current);
    });

    return peerConnection;
  };
  const acceptVoiceCall = async () => {
    if (!incomingVoiceCall) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      localStreamRef.current = stream;
      localStreamRef.current.muted = true;

      setMyStream(stream);
      setIsAudioEnabled(true);
      setTimeout(() => {
        localStreamRef.current.srcObject = stream;
        localStreamRef.current.muted = true;
      }, 500);
      setIsVoiceCallModalOpen(true);
      const { from, offer } = incomingVoiceCall;
      peerConnectionRef.current = await createVoicePeerConnection(from);

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      processBufferedCandidates();

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(
        new RTCSessionDescription(answer)
      );

      socket.emit("answer_voice_call", { to: from, answer });

      // setIncomingVoiceCall(null);
    } catch (error) {
      console.log(error);
    }
  };
  const leaveCallHandler = () => {
    if (isVideoCall) {
      socket.emit("leave_call");
      setRemoteVideos([]);
    } else {
      if (incomingCall) {
        socket.emit("leaveCall", { to: incomingCall.user_id });
      } else if (incomingVoiceCall) {
        socket.emit("leaveCall", { to: incomingVoiceCall.user_id });
      }
    }
      
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

    // Clear audio elements
    if (localStreamRef.current) {
      localStreamRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    // Reset state
    setIsMicOn(true);
    setIsVideoOn(true);
    setIsVideoEnabled(false);
    setIsVideoCall(false);
    setIsVoiceCallModalOpen(false);
    setIncomingCall(null);
    setIncomingVoiceCall(null);
  };
  const { deviceType } = useContext(contextData);
  return (
    <>
      <div className={deviceType === "mobile" ? "home mobile_home" : "home"}>
        {profileToggle && (
          <SelfProfile user={user} setProfileToggle={setProfileToggle} />
        )}
        <Sidebar
          active={active}
          setActive={setActive}
          user={user}
          setShowLogout={setShowLogout}
          showLogout={showLogout}
          modalRef={modalRef}
          profileHandler={profileHandler}
          setShowLogoutConfirm={setShowLogoutConfirm}
        />
        {showLogoutConfirm && (
          <div className="modal">
            <div className="modal-content">
              <span
                className="close-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                &times;
              </span>
              <CiLogout />
              <p>Logging Out. Are you Sure?</p>
              <div className="modal-actions">
                <button
                  className="btn no"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  NO
                </button>
                <button className="btn yes" onClick={logoutUser}>
                  YES
                </button>
              </div>
            </div>
          </div>
        )}
        {incomingCall && showIncomingCall && !isVideoEnabled && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Incoming video Call</h2>
              <p> is calling...</p>
              <div className="modal-buttons">
                <audio
                  ref={audioRef}
                  preload="auto"
                  src="/sound/incomingcall.mp3"
                />
                <button className="accept-btn" onClick={acceptCall}>
                  Accept
                </button>
                <button className="reject-btn" onClick={rejectCall}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
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
        {incomingVoiceCall && !isVoiceCallModalOpen && (
          <div className="modal-overlay">
            <audio
              ref={audioRef}
              preload="auto"
              src="/sound/incomingcall.mp3"
            />
            <div className="modal-content">
              <h2>Incoming Voice Call</h2>
              <p> is calling...</p>
              <div className="modal-buttons">
                <button className="accept-btn" onClick={acceptVoiceCall}>
                  Accept
                </button>
                <button className="reject-btn" onClick={rejectCall}>
                  Reject
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
        {isVideoCall && (
          <div className="group-video-call-modal">
            <div className="group-video-call-modal__content">
              <div className="modal_controls">
                <button
                  className={`control_button ${!isMicOn ? "disabled" : ""}`}
                  onClick={() => (toggleAudio(), setIsMicOn(!isMicOn))}
                >
                  {isMicOn ? <FiMic /> : <FiMicOff />}
                </button>
                <button
                  className={`control_button ${!isVideoOn ? "disabled" : ""}`}
                  onClick={() => (toggleVideo(), setIsVideoOn(!isVideoOn))}
                >
                  {isVideoOn ? <FiVideo /> : <FiVideoOff />}
                </button>
                <button
                  className="control_button end_call_button"
                  onClick={leaveCallHandler}
                >
                  call End
                </button>
              </div>
              <div className="group-video-call-modal__users">
                {/* Local User Video */}
                {
                  <div className="group-video-call-modal__user-card group-video-call-modal__user-card--on-call">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      className="group-video-call-modal__video-feed"
                    />
                  </div>
                }
                {/* Other Users */}
                {<GroupVideoCall remoteVideos={remoteVideos} />}
              </div>
            </div>
          </div>
        )}
        <Outlet />
      </div>
    </>
  );
};

export default Home;
