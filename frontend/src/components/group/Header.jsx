import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import "./GroupLayout.css";
import {
  FiMic,
  FiMicOff,
  FiPhone,
  FiUsers,
  FiVideo,
  FiVideoOff,
} from "react-icons/fi";
import profile from "../../assets/img/manprofile.png";
import { useDispatch, useSelector } from "react-redux";
import AvatarGroup from "./AvatarGroup";
import { MdOutlinePersonAddAlt1 } from "react-icons/md";
import { AiOutlineClose } from "react-icons/ai";
import { fetchUsers } from "../../redux/slice/userSlice";
import Cookies from "js-cookie";
import { persistor } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { addMembersHandler } from "../../redux/slice/messageSlice";
import { socket } from "../../context/context";
import { v4 as uuidv4 } from "uuid";
import * as mediasoupClient from "mediasoup-client";
import GroupProfile from "../contact/GroupProfile";

const Header = () => {
  const { user } = useSelector((state) => state.guests);
  let rtpCapabilities;
  let device = useRef(undefined);
  let localVideoRef = useRef(null);
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

  let audioParams;
  let videoParams = { params };
  let consumingTransports = [];
  const {
    group_chat: { current_group, messages },
  } = useSelector((state) => state.conversation);
  const { guests } = useSelector((state) => state.guests);

  const [query, setQuery] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [remoteVideos, setRemoteVideos] = useState([]);
  const [myStream, setMyStream] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [token, setToken] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [suggested, setSuggested] = useState(guests);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [groupProfile, setGroupProfile] = useState(false);
  const [incomingGroupVideoCall, seIncomingGroupVideoCall] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const membersListfunc = (list) =>
    list.map((val) => val.user._id).filter((val) => val !== userId);
  const connectRecvTransport = async (
    consumerTransport,
    remoteProducerId,
    serverConsumerTransportId
  ) => {
    // for consumer, we need to tell the server first
    // to create a consumer based on the rtpCapabilities and consume
    // if the router can consume, it will send back a set of params as below
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

        // then consume with the local consumer transport
        // which creates a consumer
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
        setRemoteVideos((prev) => [
          ...prev,
          {
            id: remoteProducerId,
            stream: new MediaStream([consumer.track]),
            kind: params.kind,
          },
        ]);
        // create a new div element for the new consumer media

        // the server consumer started with media paused
        // so we need to inform the server to resume
        socket.emit("consumer-resume", {
          serverConsumerId: params.serverConsumerId,
        });
      }
    );
  };
  const signalNewConsumerTransport = async (remoteProducerId) => {
    console.error("new running.................");
    //check if we are already consuming the remoteProducerId
    if (consumingTransports.includes(remoteProducerId)) return;
    consumingTransports.push(remoteProducerId);

    await socket.emit(
      "createWebRtcTransport",
      { consumer: true },
      ({ params }) => {
        // The server sends back params needed
        // to create Send Transport on the client side
        if (params.error) {
          console.log(params.error);
          return;
        }

        let consumerTransport;
        try {
          consumerTransport = device.current.createRecvTransport(params);
        } catch (error) {
          // exceptions:
          // {InvalidStateError} if not loaded
          // {TypeError} if wrong arguments.
          console.log(error);
          return;
        }

        consumerTransport.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            try {
              // Signal local DTLS parameters to the server side transport
              // see server's socket.on('transport-recv-connect', ...)
              await socket.emit("transport-recv-connect", {
                dtlsParameters,
                serverConsumerTransportId: params.id,
              });

              // Tell the transport that parameters were transmitted.
              callback();
            } catch (error) {
              // Tell the transport that something was wrong
              errback(error);
            }
          }
        );

        connectRecvTransport(consumerTransport, remoteProducerId, params.id);
      }
    );
  };
  useEffect(() => {
    socket.on("group_call_failed", () => {
      localVideoRef.current = null;
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
      setIsVideoCall(false);
    });

    // socket.on("incoming_group_call", (data) => {
    //   seIncomingGroupVideoCall(data.roomName);
    // });
    socket.on("new-producer", ({ producerId }) =>
      signalNewConsumerTransport(producerId)
    );
    socket.on("producer-closed", ({ remoteProducerId }) =>
      handleProducerClosed(remoteProducerId)
    );

    return () => {
      if(socket) {
        socket.off("group_call_failed");
        socket.off("new-producer");
        socket.off("producer-closed");
      }
    };
  }, [socket]);
  const getProducers = () => {
    socket.emit("getProducers", (producerIds) => {
      // for each of the producer create a consumer
      // producerIds.forEach(id => signalNewConsumerTransport(id))
      producerIds.forEach(signalNewConsumerTransport);
    });
  };
  const createDevice = async () => {
    try {
      device.current = new mediasoupClient.Device();

      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-load
      // Loads the device with RTP capabilities of the Router (server side)
      await device.current.load({
        // see getRtpCapabilities() below
        routerRtpCapabilities: rtpCapabilities,
      });

      // once the device loads, create transport
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
        console.log(params.error);
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
    // we now call produce() to instruct the producer transport
    // to send media to the Router
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
    // this action will trigger the 'connect' and 'produce' events above

    audioProducer = await producerTransport.produce(audioParams);
    videoProducer = await producerTransport.produce(videoParams);

    audioProducer.on("trackended", () => {
      // close audio track
    });

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
  const memberHandler = async () => {
    const membersList = selectedUsers.map((val) => val._id);
    setSelectedUsers([]);
    const addMembers = await dispatch(
      addMembersHandler({
        membersList,
        groupId: current_group._id,
        userId,
        token,
      })
    );
    if(addMembers?.payload?.message === "Members added successfully") {
      setQuery("");
      setModalOpen(false);
    }
  };
  useEffect(() => {
    const userData = Cookies.get("user");

    if (!userData) return;
    const parsedData = JSON.parse(userData);
    setUserId(parsedData.userId);
    setToken(parsedData.token);
    if (query.trim() === "") {
      setShowSuggestions(false);
      return;
    }

    const debounceTimeout = setTimeout(() => {
      dispatch(
        fetchUsers({
          query,
          userId: parsedData.userId,
          token: parsedData.token,
        })
      )
        .unwrap()
        .then((response) => {
          const currentGroupParticipantIds = current_group?.participants?.filter((user) => 
              user.status !== 'left'
            ).map(
              (participant) => participant.user._id
            ) || [];

          // Exclude already selected and group participants from suggestions
          const remaining = response.filter((val) => {
            return (
              !selectedUsers.some((selected) => selected._id === val._id) &&
              !currentGroupParticipantIds.includes(val._id)
            );
          });

          setSuggested(remaining);
        })
        .catch((error) => {
          setShowSuggestions(false);
          if (error === "Unauthorized") {
            persistor.purge();
            Cookies.remove("user");

            navigate("/");
          }
        });
      if (suggested?.length > 0) {
        setShowSuggestions(true);
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [query, dispatch]);
  useEffect(() => {
    setShowSuggestions(suggested?.length > 0);
  }, [suggested]);

  const groupCallHandler = () => {
    setIsVideoCall(true);
    try {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: true,
        })
        .then((stream) => {
          setMyStream(stream);

          setTimeout(() => {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream; // Assign stream correctly
              localVideoRef.current.muted = true;
            }
          }, 500); // Reduce timeout

          audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
          videoParams = { track: stream.getVideoTracks()[0], ...videoParams };
          const membersList = membersListfunc(current_group.participants);
          socket.emit("checkGroup", { chat: membersList }, (data) => {
            if (data.call) {
              const roomid = uuidv4();
              socket.emit(
                "joinGroupCall",
                { chat: membersList, roomName: roomid, producer: true },
                (data) => {
                  console.log(
                    ` Router RTP Capabilities... ${data.rtpCapabilities}`
                  );
                  rtpCapabilities = data.rtpCapabilities;
                  createDevice();
                }
              );
            } else {
              setIsVideoCall(false);
            }
          });
        })
        .catch((error) => {
          alert("User media not found");
        });
    } catch (error) {
      console.log(error);
    }
  };

  const acceptVideoCall = () => {
    try {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: true,
        })
        .then((stream) => {
          seIncomingGroupVideoCall(false);
          setIsVideoCall(true);
          localVideoRef.current = stream;
          setTimeout(() => {
            localVideoRef.current.srcObject = stream;
          }, 500);

          audioParams = { track: stream.getAudioTracks()[0], ...audioParams };

          videoParams = { track: stream.getVideoTracks()[0], ...videoParams };
          socket.emit(
            "joinGroupCall",
            { roomName: incomingGroupVideoCall, producer: false },
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
  };
  const handleProducerClosed = (remoteProducerId) => {
    setRemoteVideos((prev) =>
      prev.filter((video) => video.id !== remoteProducerId)
    );
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
      <audio ref={audioRef} autoPlay playsInline className="remote-video" />
    );
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
  const leaveCallHandler = () => {
    socket.emit("leave_call");

    // Stop all tracks and clear stream
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }

    // Clear local video element
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Reset state
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setIsVideoCall(false);
    setRemoteVideos([]);
  };
  return (
    <>
      {incomingGroupVideoCall && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Incoming video Call</h2>
            <p> is calling...</p>
            <div className="modal-buttons">
              <button className="accept-btn" onClick={acceptVideoCall}>
                Accept
              </button>
              <button className="reject-btn">Reject</button>
            </div>
          </div>
        </div>
      )}
      {isVideoCall && (
        <div className="group-video-call-modal">
          <div className="group-video-call-modal__content">
            <div className="modal_controls">
              <button
                className={`control_button ${
                  !isAudioEnabled ? "disabled" : ""
                }`}
                onClick={() => (
                  toggleAudio(), setIsAudioEnabled(!isAudioEnabled)
                )}
              >
                {isAudioEnabled ? <FiMic /> : <FiMicOff />}
              </button>
              <button
                className={`control_button ${
                  !isVideoEnabled ? "disabled" : ""
                }`}
                onClick={() => (
                  toggleVideo(), setIsVideoEnabled(!isVideoEnabled)
                )}
              >
                {isVideoEnabled ? <FiVideo /> : <FiVideoOff />}
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

      {modalOpen && (
        <div className="group_modal_overlay">
          <div className="group_modal_main_container">
            <div className="group_modal_header_container">
              <div className="group_modal_header">
                <FiUsers />
                <h3>Add Members</h3>
              </div>
              <AiOutlineClose
                className="group_modal_close_button"
                onClick={() => {
                  setModalOpen(false);
                  setQuery("");

                  setSelectedUsers([]);
                }}
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="group_modal_selected_users">
                {selectedUsers.map((user) => (
                  <div className="group_modal_selected_user" key={user._id}>
                    <span>
                      {user.firstname.length > 6
                        ? `${user.firstname.slice(0, 6)}...`
                        : `${user.firstname}`}
                    </span>
                    <AiOutlineClose
                      className="remove_user_icon"
                      onClick={() => {
                        setSelectedUsers((prev) =>
                          prev.filter((selected) => selected._id !== user._id)
                        );
                        suggested.unshift(user);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="group_modal_input_container">
              <h3>Add Members</h3>

              <input
                type="text"
                placeholder="Type to search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Suggestions Container */}
            {showSuggestions && (
              <div className="group_modal_suggestions_container">
                {suggested?.slice(0, 5).map((user) => (
                  <div
                    key={user._id}
                    className="group_modal_suggestion"
                    onClick={() => {
                      if (!selectedUsers.find((u) => u._id === user._id)) {
                        setSelectedUsers((prev) => [...prev, user]);

                        // const currentGroupParticipantIds =
                        //   current_group?.participants?.map(
                        //     (participant) => participant.user._id
                        //   ) || [];
                        const currentGroupParticipantIds = current_group?.participants?.filter((user) => 
                          user.status !== 'left'
                        ).map(
                          (participant) => participant.user._id
                        ) || [];

                        const remaining = guests.filter(
                          (guest) =>
                            !selectedUsers.some(
                              (selected) => selected._id === guest._id
                            ) &&
                            !currentGroupParticipantIds.includes(guest._id) &&
                            guest._id !== user._id
                        );
                        setSuggested(remaining);
                      }
                    }}
                  >
                    <div className="group_modal_image_container">
                      <img
                        src={user.profile ? user.profile : profile}
                        alt="profile"
                      />
                    </div>
                    <span>{`${user.firstname} ${user.lastname}`}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="group_modal_button_container">
              <button
                className="group_close"
                onClick={() => {
                  setModalOpen(false);
                  setQuery("");
                  setSelectedUsers([]);
                }}
              >
                Cancel
              </button>
              <button
                className="group_submit"
                disabled={selectedUsers.length < 1 ? true : false}
                onClick={() => memberHandler()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
      {groupProfile && (
        <GroupProfile
          setGroupProfile={setGroupProfile}
          groupCallHandler={groupCallHandler}
          profile={profile}
          current_group={current_group}
          messages={messages}
        />
      )}
      <div className="selected_group_heading">
        <div
          className="selected_group_profile_container"
          onClick={() => setGroupProfile(true)}
        >
          <div className="selected_group_image_container">
            <img
              src={
                current_group?.groupProfile
                  ? current_group?.groupProfile
                  : profile
              }
              alt="profile"
            />
          </div>
          <div className="selected_group_name_container">
            <h5>{current_group.groupName.slice(0, 20)}</h5>
            <div className="group_status_container">
              <AvatarGroup users={current_group?.participants.filter((user) => user.status !== 'left')} />
            </div>
          </div>
        </div>
        <div className="call_container">
          <div className="audio_call" onClick={groupCallHandler}>
            <FiVideo />
          </div>
          <div className="audio_call" onClick={() => setModalOpen(true)}>
            <MdOutlinePersonAddAlt1 />
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(Header);
