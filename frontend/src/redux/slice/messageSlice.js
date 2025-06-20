import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import { Base_Url } from "../../utils/config";
// import axios from "axios";
import { axios } from "../../utils/apiInterceptor";
import Cookies from "js-cookie";
import { AiOutlineConsoleSql } from "react-icons/ai";
import { playNotification } from "../../utils/NotificationSound";
import { socket } from "../../context/context";

let userData = Cookies.get("user");
let parsedData;
let user_id;
let token;
if (userData) {
  parsedData = JSON.parse(userData);
  user_id = parsedData.userId;
}

const initialState = {
  direct_chat: {
    conversations: [],
    current_conversation: null,
    messages: [],
    current_user: null,
  },
  group_chat: {
    groups: [],
    current_group: null,
    messages: [],
  },
  error: null,
  loading: false,
  msgLoading: false,
  msgError: false,
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    sendMessage: (state, action) => {
      const { data, userId } = action.payload;

      const { message, dateMessage } = data;
      if (message.conversation === "chat") {
        const conversations = JSON.parse(
          JSON.stringify(state.direct_chat.conversations)
        );

        const messages = JSON.parse(JSON.stringify(state.direct_chat.messages));

        const conversation = conversations.find(
          (val) => val._id === data.conversation_id
        );

        const index = conversations.findIndex(
          (val) => val._id === data.conversation_id
        );
        const selfConvo = conversations.find(
          (val) => val.participants[0]._id === message.to
        );
        const selfIndex = conversations.findIndex(
          (val) => val.participants[0]._id === message.to
        );

        if (conversation && index >= 0) {
          const updatedConversation = {
            ...conversation,
            messages: [message, ...conversation.messages],
          };

          state.direct_chat.conversations = [
            updatedConversation,
            ...state.direct_chat.conversations.slice(0, index),
            ...state.direct_chat.conversations.slice(index + 1),
          ];
          const conversationid = JSON.parse(
            JSON.stringify(state.direct_chat.current_conversation)
          );

          if (data.conversation_id === conversationid) {
            if (
              message.from === userId &&
              message.type !== "link" &&
              message.type !== "text"
            ) {
              const index = messages.findIndex(
                (val) => val.msgId === message.msgId
              );

              if (index) {
                state.direct_chat.messages = [
                  ...state.direct_chat.messages.slice(0, index),
                  message,
                  ...state.direct_chat.messages.slice(index + 1),
                ];
              } else if (index === 0) {
                state.direct_chat.messages = [
                  message,
                  ...state.direct_chat.messages.slice(1),
                ];
              } else {
                state.direct_chat.messages = [
                  message,
                  ...state.direct_chat.messages,
                ];
              }
            } else {
              state.direct_chat.messages = [
                message,
                ...state.direct_chat.messages,
              ];
            }
          }
        } else if (selfConvo && selfIndex >= 0) {
          const updatedConversation = {
            ...selfConvo,
            messages: [message, ...selfConvo.messages],
            _id: data.conversation_id,
          };
          state.direct_chat.conversations = [
            updatedConversation,
            ...state.direct_chat.conversations.slice(0, selfIndex),
            ...state.direct_chat.conversations.slice(selfIndex + 1),
          ];
          if (
            state.direct_chat.current_user._id ===
            selfConvo.participants[0]._id &&
            state.direct_chat.current_conversation === undefined
          ) {
            state.direct_chat.current_conversation = data.conversation_id;
            if (
              message.from === userId &&
              message.type !== "link" &&
              message.type !== "text"
            ) {
              const index = messages.findIndex(
                (val) => val.msgId === message.msgId
              );

              if (index) {
                state.direct_chat.messages = [
                  ...state.direct_chat.messages.slice(0, index),
                  message,
                  ...state.direct_chat.messages.slice(index + 1),
                ];
              } else if (index === 0) {
                state.direct_chat.messages = [
                  message,
                  ...state.direct_chat.messages.slice(1),
                ];
              } else {
                state.direct_chat.messages = [
                  message,
                  ...state.direct_chat.messages,
                ];
              }
            } else {
              state.direct_chat.messages = [
                message,
                ...state.direct_chat.messages,
              ];
            }
          }
        } else {
          state.direct_chat.conversations = [
            data.newChats,
            ...state.direct_chat.conversations,
          ];
        }
      } else if (message.conversation === "group") {
        const conversations = JSON.parse(
          JSON.stringify(state.group_chat.groups)
        );

        const messages = JSON.parse(JSON.stringify(state.group_chat.messages));
        const conversation = conversations.find(
          (val) => val._id === data.conversation_id
        );

        const current_group_convo = JSON.parse(
            JSON.stringify(state.group_chat.current_group)
          );
        const conversationid = current_group_convo?._id;
        if(current_group_convo && conversationid === data.conversation_id){
          message.seen?.push(user_id);
          socket.emit("group_message_seen", {
            conversation_id: data.conversation_id,
            messageId: data.message._id,
            user_id: user_id,
          });
        }

        const index = conversations.findIndex(
          (val) => val._id === data.conversation_id
        );
        if (conversation && index >= 0) {
          const updatedConversation = {
            ...conversation,
            messages: dateMessage
              ? [message, dateMessage, ...conversation.messages]
              : [message, ...conversation.messages],
          };

          state.group_chat.groups = [
            updatedConversation,
            ...state.group_chat.groups.slice(0, index),
            ...state.group_chat.groups.slice(index + 1),
          ];
          

          if (current_group_convo && data.conversation_id === conversationid) {
            if (
              message.from === userId &&
              message.type !== "link" &&
              message.type !== "text" &&
              message.type !== "addMember" &&
              message.type !== "removeMember"
            ) {
              const index = messages.findIndex(
                (val) => val.msgId === message.msgId
              );

              if (index) {
                state.group_chat.messages = dateMessage
                  ? [
                    ...state.group_chat.messages.slice(0, index),
                    message,
                    dateMessage,
                    ...state.group_chat.messages.slice(index + 1),
                  ]
                  : [
                    ...state.group_chat.messages.slice(0, index),
                    message,
                    ...state.group_chat.messages.slice(index + 1),
                  ];
              } else if (index === 0) {
                state.group_chat.messages = dateMessage
                  ? [
                    message,
                    dateMessage,
                    ...state.group_chat.messages.slice(1),
                  ]
                  : [message, ...state.group_chat.messages.slice(1)];
              } else {
                state.group_chat.messages = dateMessage
                  ? [message, dateMessage, ...state.group_chat.messages]
                  : [message, ...state.group_chat.messages];
              }
            } else {
              state.group_chat.messages = [
                message,
                ...state.group_chat.messages,
              ];
            }
          }
        }
      }

      if(message.from !== userId) {
        if(data.conversation_id !== state.direct_chat.current_conversation && data.conversation_id !== state.group_chat.current_group?._id) {
          playNotification();
        }
      }
    },
    setInitial: (state, action) => {
      state.direct_chat.current_conversation = null;
    },
    setMessagesValue: (state) => {
      state.direct_chat.current_conversation = null;
      state.direct_chat.messages = [];
      state.direct_chat.current_user = null;
    },
    setStatus: (state, action) => {
      const index = state.direct_chat.conversations.findIndex(
        (val) => val.participants[0]._id === action.payload.user_id
      );
      const conversation = state.direct_chat.conversations.filter(
        (val) => val.participants[0]._id === action.payload.user_id
      );

      if (index >= 0) {
        state.direct_chat.conversations[index].participants[0].status =
          action.payload.status;
      }
      if (
        state.direct_chat.current_user &&
        state.direct_chat.current_user._id === action.payload.user_id
      ) {
        state.direct_chat.current_user.status = action.payload.status;
      }
    },
    messageStatu: (state, action) => {
      const obj = {
        type: "text",
        text: "This message is deleted",
        status: "delete",
      };
      if (state.direct_chat.current_conversation === action.payload.search) {
        const index = state.direct_chat.messages.findIndex(
          (val) => val._id === action.payload.messageId
        );

        if (index !== -1) {
          state.direct_chat.messages[index] = {
            ...state.direct_chat.messages[index],
            ...obj,
          };
        }
      }
      const conversationIndex = state.direct_chat.conversations.findIndex(
        (val) => val._id === action.payload.search
      );
      if (conversationIndex !== -1) {
        const indexMessage = state.direct_chat.conversations[
          conversationIndex
        ].messages.findIndex((val) => val._id === action.payload.messageId);
        if (indexMessage !== -1) {
          state.direct_chat.conversations[conversationIndex].messages[
            indexMessage
          ] = {
            ...state.direct_chat.conversations[conversationIndex].messages[
            indexMessage
            ],
            ...obj,
          };
        }
      }
    },
    groupMessageStatus: (state, action) => {
      const obj = {
        type: "text",
        text: "This message is deleted",
        status: "delete",
      };
      if (state.group_chat.current_group?._id === action.payload.search) {
        const index = state.group_chat.messages.findIndex(
          (val) => val._id === action.payload.messageId
        );

        if (index !== -1) {
          state.group_chat.messages[index] = {
            ...state.group_chat.messages[index],
            ...obj,
          };
        }
        const conversationIndex = state.group_chat.messages.findIndex(
          (val) => val._id === action.payload.search
        );
        if (conversationIndex !== -1) {
          const indexMessage = state.group_chat.messages[
            conversationIndex
          ].messages.findIndex((val) => val._id === action.payload.messageId);
          if (indexMessage !== -1) {
            state.group_chat.messages[conversationIndex].messages[
              indexMessage
            ] = {
              ...state.group_chat.messages[conversationIndex].messages[
              indexMessage
              ],
              ...obj,
            };
          }
        }
      }
    },
    editGroupMessage: (state, action) => {
      const { search, messageId, newText } = action.payload;
      if (state.group_chat.current_group._id === search) {
        const index = state.group_chat.messages.findIndex(
          (val) => val._id === action.payload.messageId
        );

        if (index !== -1) {
          state.group_chat.messages[index] = {
            ...state.group_chat.messages[index],
            ...{ text: newText },
          };
        }
        const conversationIndex = state.group_chat.messages.findIndex(
          (val) => val._id === action.payload.search
        );
        if (conversationIndex !== -1) {
          const indexMessage = state.group_chat.messages[
            conversationIndex
          ].messages.findIndex((val) => val._id === action.payload.messageId);
          if (indexMessage !== -1) {
            state.group_chat.messages[conversationIndex].messages[
              indexMessage
            ] = {
              ...state.group_chat.messages[conversationIndex].messages[
              indexMessage
              ],
              ...{ text: newText },
            };
          }
        }
      }
    },
    messageEdit: (state, action) => {
      const { search, messageId, newText } = action.payload;
      if (state.direct_chat.current_conversation === action.payload.search) {
        const index = state.direct_chat.messages.findIndex(
          (val) => val._id === action.payload.messageId
        );

        if (index !== -1) {
          state.direct_chat.messages[index] = {
            ...state.direct_chat.messages[index],
            ...{ text: newText },
          };
        }
        const conversationIndex = state.direct_chat.conversations.findIndex(
          (val) => val._id === search
        );
        if (conversationIndex !== -1) {
          const indexMessage = state.direct_chat.conversations[
            conversationIndex
          ].messages.findIndex((val) => val._id === messageId);
          if (indexMessage !== -1) {
            state.direct_chat.conversations[conversationIndex].messages[
              indexMessage
            ] = {
              ...state.direct_chat.conversations[conversationIndex].messages[
              indexMessage
              ],
              ...{ text: newText },
            };
          }
        }
      }
    },
    addGroup: (state, action) => {
      state.group_chat.groups = [
        action.payload.data.groupInfo,
        ...state.group_chat.groups,
      ];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        const data = action.payload;
        const sortedData = data.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        state.direct_chat.conversations = sortedData;
        if (state.direct_chat.current_conversation === undefined) {
          state.direct_chat.current_conversation = null;
        }

        state.loading = false;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.direct_chat.conversations = [];
        state.loading = false;
        if (state.direct_chat.current_conversation === undefined) {
          state.direct_chat.current_conversation = null;
        }
        state.error = action.payload;
      })
      .addCase(fetchSelectedConversation.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(fetchSelectedConversation.fulfilled, (state, action) => {
        const data = action.payload;

        // Get the selected user
        const selectedUser = data[0].participants.filter(
          (val) => val._id !== action.meta.arg.user_id
        );

        // Check if conversations array has an empty first item
        if (
          state.direct_chat.conversations.length > 0 &&
          !state.direct_chat.conversations[0]?._id
        ) {
          state.direct_chat.conversations = [
            ...state.direct_chat.conversations.slice(1),
          ];
        }

        // Update conversation messages correctly
        const updatedConversations = state.direct_chat.conversations.map(
          (val) => {
            if (val._id === data[0]._id) {
              return {
                ...val,
                messages: val.messages.map((item) => {
                  if (
                    action.meta.arg.user_id === item.to &&
                    item.seen.length === 0
                  ) {
                    return { ...item, seen: [item.to] }; // ✅ Correctly updating `seen`
                  }

                  return item;
                }),
              };
            }
            return val;
          }
        );
        state.direct_chat.conversations = updatedConversations;
        state.direct_chat.current_user = selectedUser[0];
        state.direct_chat.current_conversation = data[0]._id;
        state.direct_chat.messages = data[0].messages;

        state.loading = false;
      })

      .addCase(fetchSelectedConversation.rejected, (state, action) => {
        state.direct_chat.current_conversation = null;
        state.direct_chat.messages = [];
        state.loading = false;
        state.current_user = null;
        state.error = action.payload;
      })
      .addCase(sendMedia.pending, (state, action) => {
        // const imageUrl = URL.createObjectURL(action.meta.arg.vauee)
        let messageValue = action.meta.arg.obj;
        const imageUrl = URL.createObjectURL(action.meta.arg.obj.file);
        messageValue.file = imageUrl;
        if (messageValue.conversation === "chat") {
          state.direct_chat.messages = [
            messageValue,
            ...state.direct_chat.messages,
          ];
          state.msgLoading = true;
        } else if (messageValue.conversation === "group") {
          state.group_chat.messages = [
            messageValue,
            ...state.group_chat.messages,
          ];
          state.msgLoading = true;
        }
      })
      .addCase(sendMedia.fulfilled, (state, action) => {
        const data = action.payload;

        state.msgLoading = false;
      })
      .addCase(sendMedia.rejected, (state, action) => {
        state.msgLoading = false;
        state.msgError = action.payload;
      })
      .addCase(checkConversation.pending, (state, action) => {
        state.msgLoading = true;
      })
      .addCase(checkConversation.fulfilled, (state, action) => {
        state.msgLoading = false;
        const data = action.payload;
        if (
          data.index === 0 &&
          state.direct_chat.current_conversation === data.conversation[0]._id
        ) {
        } else if (
          data.index === 0 &&
          state.direct_chat.current_conversation !== data.conversation[0]._id
        ) {
          state.direct_chat.current_conversation = data.conversation[0]._id;
          state.direct_chat.current_user = data.conversation[0].participants[0];
          state.direct_chat.messages = data.conversation[0].messages;
        } else if (
          data.index > 0 &&
          state.direct_chat.current_conversation !== data.conversation[0]._id
        ) {
          state.direct_chat.current_conversation = data.conversation[0]._id;
          state.direct_chat.current_user = data.conversation[0].participants[0];
          state.direct_chat.messages = data.conversation[0].messages;
        } else if (data.index < 0) {
          state.direct_chat.current_conversation = data.conversation[0]._id;
          state.direct_chat.current_user = data.conversation[0].participants[0];

          if (
            state.direct_chat.conversations[0] === undefined ||
            state.direct_chat.conversations[0]._id
          ) {
            state.direct_chat.conversations = [
              ...data.conversation,
              ...state.direct_chat.conversations,
            ];
          } else if (state.direct_chat.conversations[0]._id === undefined) {
            state.direct_chat.conversations = [
              ...data.conversation,
              ...state.direct_chat.conversations.slice(1),
            ];
          }

          state.direct_chat.messages = data.conversation[0].messages;
        }
      })
      .addCase(chatStatus.fulfilled, (state, action) => {
        const conId = state.direct_chat.conversations.findIndex(
          (val) => val._id === action.payload.chatId
        );
        if (conId !== -1) {
          const statusArray = state.direct_chat.conversations[conId].status;
          if (action.payload.status === "archive") {
            statusArray.push(action.payload.user_id);
          } else {
            const indexToRemove = statusArray.indexOf(action.payload.user_id);
            if (indexToRemove !== -1) {
              statusArray.splice(indexToRemove, 1);
            }
          }
        }
      })
      .addCase(fetchGroups.pending, (state, action) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        const data = action.payload;
        const sortedData = data.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        state.group_chat.groups = sortedData;

        state.loading = false;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.group_chat.groups = [];
        state.loading = false;

        state.error = action.payload;
      })
      .addCase(fetchSelectedGroup.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(fetchSelectedGroup.fulfilled, (state, action) => {
        const data = action.payload;
        const {
          groupName,
          groupStatus,
          _id,
          participants,
          messages,
          groupProfile,
          meetingRooms,
        } = data[0];
        state.group_chat.current_group = {
          groupName,
          groupStatus,
          _id,
          participants,
          groupProfile,
          meetingRooms,
        };
        state.group_chat.messages = messages;
        state.loading = false;

        state.group_chat.groups.find((group) => group._id === _id).messages.forEach((message) => {
          // If the message is received by the user and unseen, mark it as seen
          if (!message.seen?.includes(user_id)) {
            message.seen?.push(user_id);
            // messagesUpdated = true;
          }
        });

        // if (messagesUpdated) {
        //   state.group_chat.current_group.messages = state.group_chat.current_group.messages;
        //   state.group_chat.current_group.participants.forEach(async (val) => {
        //     if(val.status !== 'left') {
        //       const emp = await User.findOne({ _id: val.user.toString() });

        //       io.to(emp?.socket_id).emit("group_message", {
        //         conversation_id : state.group_chat.current_group._id,
        //         message: state.group_chat.current_group.messages,
        //       });
        //     }
        //   });
        // }
      })
      .addCase(fetchSelectedGroup.rejected, (state, action) => {
        state.group_chat.current_group = null;
        state.group_chat.messages = [];
        state.loading = false;
      })
      .addCase(addMembersHandler.fulfilled, (state, action) => {
        const data = action.payload;
        const { message, status } = data;
        if (message === "Members added successfully") {
          // state.group_chat.current_group.participants = [
          //   ...state.group_chat.current_group.participants,
          //   ...action.payload.newMembers,
          // ];
        }
      })
      .addCase(removeMemberHandler.fulfilled, (state, action) => {
        const data = action.payload;
        const { message, status } = data;
        if (message === "Member removed successfully") {
          // state.group_chat.current_group.participants = state.group_chat.current_group.participants.filter(
          //   (val) => val?.user?._id !== action.payload.memberId
          // );
        }
      })
      .addCase(removeGroup.fulfilled, (state, action) => {
        const groupId = action.payload;
        let userData = Cookies.get("user");
        let user_id;
        if (userData) {
          user_id = JSON.parse(userData).userId;
        }
        console.warn("current user_id => ", user_id);

        if(state.group_chat.current_group?._id === groupId){
          state.group_chat.current_group.participants.forEach((member, i) => {
            if(member.user._id.toString() === user_id) {
              state.group_chat.current_group.participants[i].status = "left";
            }
          })
        }
      })
      .addCase(addedOnGroup.fulfilled, (state, action) => {
        const group = action.payload
        let userData = Cookies.get("user");
        let user_id;
        if (userData) {
          user_id = JSON.parse(userData).userId;
        }

        if(state.group_chat.current_group?._id === group._id){
          // state.group_chat.current_group.participants.forEach((member, i) => {
          //   if(member.user._id.toString() === user_id) {
          //     state.group_chat.current_group.participants[i].status = "online";
          //   }
          // })
          state.group_chat.current_group = group;
        }

        if(!state.group_chat.groups.some((gr) => gr._id === group._id)) {
          state.group_chat.groups.unshift(group);
        }
      })
      .addCase(addMembersSocket.fulfilled, (state, action) => {
        const { groupId, newMembers, oldMembers} = action.payload;

        if(state.group_chat.current_group?._id === groupId) {
          state.group_chat.current_group.participants.forEach((member, i) => {
            if(oldMembers.includes(member.user?._id?.toString())) {
              state.group_chat.current_group.participants[i].status = "offline";
            }
          })
          newMembers.forEach((member) => {
            state.group_chat.current_group.participants.push(member);
          })
        }
      })
      .addCase(removeMemberSocket.fulfilled, (state, action) => {
        const { groupId, member } = action.payload;

        if(state.group_chat.current_group?._id === groupId) {
          state.group_chat.current_group.participants.forEach((emp, i) => {
            if(emp.user._id.toString() === member) {
              state.group_chat.current_group.participants[i].status = "left";
              state.group_chat.current_group.participants[i].role = "member";
            }
          })
        }
      })
      .addCase(groupUpdated.fulfilled, (state, action) => {
        const group = action.payload

        if(state.group_chat.current_group?._id === group.group_id){
          state.group_chat.current_group.groupName = group.group_name;
          state.group_chat.current_group.groupProfile = group.group_image;
        }
        
        state.group_chat.groups = state.group_chat.groups.map((val) => {
          if (val._id === group.group_id) {
            val.groupName = group.group_name;
            val.groupProfile = group.group_image;
          }
          return val;
        });
      })
      .addCase(adminPromoted.fulfilled, (state, action) => {
        if (state.group_chat.current_group) {
          if (state.group_chat.current_group._id === action.payload.groupId) {
            state.group_chat.current_group.participants.forEach((member, i) => {
              if(member.user._id.toString() === action.payload.newAdmin._id) {
                state.group_chat.current_group.participants[i].role = "admin";
              }
            })
          }
        }
      })
      .addCase(adminRemoved.fulfilled, (state, action) => {
        // Update the current group's participant role if it's the active group
        if (state.group_chat.current_group) {
          if (state.group_chat.current_group._id === action.payload.groupId) {
            state.group_chat.current_group.participants.forEach((member, i) => {
              if(member.user._id.toString() === action.payload.demotedAdmin._id) {
                state.group_chat.current_group.participants[i].role = "member";
              }
            })
          }
        }
      })
      // .addCase(makeAdminHandler.fulfilled, (state, action) => {
      //   // Update the current group's participant role if it's the active group
      //   if (state.group_chat.current_group) {
      //     const memberIndex = state.group_chat.current_group.participants.findIndex(
      //       p => p.user._id === action.meta.arg.memberId
      //     );
      //     if (memberIndex !== -1) {
      //       state.group_chat.current_group.participants[memberIndex].role = "admin";
      //     }
      //   }
      // })
      // .addCase(removeAdminHandler.fulfilled, (state, action) => {
      //   // Update the current group's participant role if it's the active group
      //   if (state.group_chat.current_group) {
      //     const memberIndex = state.group_chat.current_group.participants.findIndex(
      //       p => p.user._id === action.meta.arg.memberId
      //     );
      //     if (memberIndex !== -1) {
      //       state.group_chat.current_group.participants[memberIndex].role = "member";
      //     }
      //   }
      // })
      .addCase(leaveGroupHandler.fulfilled, (state, action) => {
        // Handle successful group leave
        // const groupId = action.meta.arg.groupId;
        
        // // Remove group from groups list or update status
        // // state.group_chat.groups = state.group_chat.groups.filter(
        // //   group => group._id !== groupId
        // // );
        
        // // Clear current group if it's the one being left
        // if (state.group_chat.current_group?._id === groupId) {
        //   state.group_chat.current_group.participants.forEach((member, i) => {
        //     if(member.user._id.toString() === user_id) {
        //       state.group_chat.current_group.participants[i].status = "left";
        //     }
        //   })
        // }
      })
  },
});

export const updateGroupProfile = createAsyncThunk(
  "group_chat/updateGroupProfile",
  async ({ formData, token, groupId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${Base_Url}/api/user/group/update-group-profile`,
        formData,
        {
          headers: {
            authorization: token,
          },
        }
      );
      // if (response.status === 200) {
      //   const group = response.data.group;
      //   state.group_chat.groups = state.group_chat.groups.map((val) => {
      //     if (val._id === groupId) {
      //       val.groupName = group.groupName;
      //       val.groupProfile = group.groupProfile;
      //     }
      //     return val;
      //   });
      // }
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchConversations = createAsyncThunk(
  "conversation/fetchConversations",
  async ({ userid, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${Base_Url}/api/user/conversations?search=${userid}`,
        {
          headers: {
            authorization: token,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);
export const fetchSelectedConversation = createAsyncThunk(
  "conversation/fetchSelectedConversation",
  async ({ search, user_id, token }, { rejectWithValue, getState }) => {
    try {
      const response = await axios.get(
        `${Base_Url}/api/user/selectedConversation?search=${search}&userid=${user_id}`,
        {
          headers: {
            authorization: token,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);
export const sendMedia = createAsyncThunk(
  "conversation/sendMedia",
  async ({ formData, obj, token }, { rejectWithValue, getState }) => {
    try {
      const response = await axios.post(
        `${Base_Url}/api/user/fileMessage`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: token,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);
export const checkConversation = createAsyncThunk(
  "conversation/checkConversation",
  async (query, { rejectWithValue, getState }) => {
    if (
      getState().conversation &&
      getState().conversation.direct_chat.conversations.length > 0
    ) {
      const state = getState().conversation.direct_chat.conversations;
      const index = state.findIndex(
        (val) => val.participants[0]._id === query._id
      );
      const conversation = state.filter(
        (val) => val.participants[0]._id === query._id
      );

      if (conversation.length > 0) {
        return { index, conversation };
      } else {
        const index = -1;
        const participants = [query];
        const messages = [];
        const updatedAt = new Date().toISOString();
        const status = "chat";
        const _id = undefined;
        const conversation = [
          {
            messages,
            participants,
            status,
            updatedAt,
            _id,
          },
        ];
        return { index, conversation };
      }
    } else {
      const index = -1;
      const participants = [query];
      const messages = [];
      const updatedAt = new Date().toISOString();
      const status = "chat";
      const _id = undefined;
      const conversation = [
        {
          messages,
          participants,
          status,
          updatedAt,
          _id,
        },
      ];
      return { index, conversation };
    }
  }
);

export const chatStatus = createAsyncThunk(
  "conversation/chatStatus",
  async ({ status, chatId, token, user_id }, { rejectWithValue, getState }) => {
    try {
      const response = await axios.patch(
        `${Base_Url}/api/user/status?search=${chatId}&status=${status}`,
        { userId: user_id },
        {
          headers: {
            authorization: token,
          },
        }
      );

      return { chatId, status, user_id };
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);
export const messageStatus = createAsyncThunk(
  "conversation/messageStatus",
  async (
    { chatId, messageId, token, to, from, val },
    { rejectWithValue, getState }
  ) => {
    try {
      const response = await axios.patch(
        `${Base_Url}/api/user/messageStatus?search=${chatId}&messageId=${messageId}`,
        { to, from, conversation : val?.conversation },
        {
          headers: {
            authorization: token,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      console.log("error = ", error);
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const editMsgHandler = createAsyncThunk(
  "conversation/editMsgHandler",
  async ({ search, messageId, token, newText, to, from, val }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${Base_Url}/api/user/message?search=${search}&messageId=${messageId}`,
        { newText, to, from, conversation : val?.conversation },
        {
          headers: {
            authorization: token,
          },
        }
      );


      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const groupHandler = createAsyncThunk(
  "conversation/groupHandler",
  async ({ formData, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${Base_Url}/api/user/group`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: token,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);
export const fetchGroups = createAsyncThunk(
  "conversation/fetchGroups",
  async ({ userid, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${Base_Url}/api/user/group?search=${userid}`,
        {
          headers: {
            authorization: token,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);
export const fetchSelectedGroup = createAsyncThunk(
  "conversation/fetchSelectedGroup",
  async ({ search, user_id, token }, { rejectWithValue, getState }) => {
    try {
      const response = await axios.get(
        `${Base_Url}/api/user/selectedGroup?search=${search}&userid=${user_id}`,
        {
          headers: {
            authorization: token,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);
export const addMembersHandler = createAsyncThunk(
  "conversation/addMembersHandler",
  async ({ membersList, groupId, userId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${Base_Url}/api/user/members?groupId=${groupId}&userId=${userId}`,
        { membersList },
        {
          headers: {
            authorization: token,
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const removeGroup = createAsyncThunk(
  "conversation/removeGroup",
  async ({ groupId }, { rejectWithValue }) => {
    try {
      return groupId;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const addedOnGroup = createAsyncThunk(
  "conversation/addedOnGroup",
  async ({ group }, { rejectWithValue }) => {
    try {
      return group;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const addMembersSocket = createAsyncThunk(
  "conversation/addMembersSocket", 
  async (data, { rejectWithValue }) => {
    try {
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const removeMemberSocket = createAsyncThunk(
  "conversation/removeMemberSocket", 
  async (data, { rejectWithValue }) => {
    try {
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const groupUpdated = createAsyncThunk(
  "conversation/groupUpdated",
  async ({ data }, { rejectWithValue }) => {
    try {
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const adminPromoted = createAsyncThunk(
  "conversation/adminPromoted",
  async (data, { rejectWithValue }) => {
    try {
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const adminRemoved = createAsyncThunk(
  "conversation/adminRemoved",
  async (data, { rejectWithValue }) => {
    try {
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const creatorRemoved = createAsyncThunk(
  "conversation/creatorRemoved",
  async (data, { rejectWithValue }) => {
    try {
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const makeAdminHandler = createAsyncThunk(
  "conversation/makeAdmin",
  async ({ memberId, groupId, requesterId, token }, { rejectWithValue }) => {
    const confirmed = window.confirm("Are you sure you want to make this member an admin?");
    if(!confirmed) return;
    try {
      const response = await axios.post(
        `${Base_Url}/api/user/group/make-admin`,
        { memberId, groupId, requesterId },
        {
          headers: {
            authorization: token
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const removeAdminHandler = createAsyncThunk(
  "conversation/removeAdmin",
  async ({ memberId, groupId, requesterId, token }, { rejectWithValue }) => {
    const confirmed = window.confirm("Are you sure you want to remove admin privileges from this member?");
    if(!confirmed) return;
    try {
      const response = await axios.post(
        `${Base_Url}/api/user/group/remove-admin`,
        { memberId, groupId, requesterId },
        {
          headers: {
            authorization: token
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const leaveGroupHandler = createAsyncThunk(
  "conversation/leaveGroup",
  async ({ groupId, userId, newAdminId, assignmentType, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${Base_Url}/api/user/group/leave`,
        { groupId, userId, newAdminId, assignmentType },
        {
          headers: {
            authorization: token
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const removeMemberHandler = createAsyncThunk(
  "conversation/removeMembersHandler",
  async ({ member, groupId, userId, token }, { rejectWithValue }) => {
    const confirmed = window.confirm("Are you sure you want to remove this member?");
    if(!confirmed) return;
    try {
      const response = await axios.delete(
        `${Base_Url}/api/user/member?groupId=${groupId}&userId=${userId}`,
        {
          data: { member },
          headers: {
            authorization: token
          }
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export default conversationSlice.reducer;
export const {
  sendMessage,
  setInitial,
  addGroup,
  setMessagesValue,
  setStatus,
  messageStatu,
  messageEdit,
  groupMessageStatus, 
  editGroupMessage
} = conversationSlice.actions;
