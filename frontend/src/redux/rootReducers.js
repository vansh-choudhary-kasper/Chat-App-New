import { combineReducers } from "redux";
import storage from "redux-persist/lib/storage";
import userReducer from "./slice/loginSlice";
import guestReducer from "./slice/userSlice";
import callReducer from "./slice/callSlice";
import conversationReducer from "./slice/messageSlice";
import createTransform from "redux-persist/es/createTransform";

// Define the RESET_STATE action type
export const RESET_STATE = "RESET_STATE";
export const RESET_DIRECT_CHAT = "RESET_DIRECT_CHAT";
export const RESET_GROUP_CHAT = "RESET_GROUP_CHAT";
// Transform for login slice
const userTransform = createTransform(
  (inboundState) => ({ userData: inboundState.userData }),
  (outboundState) => outboundState,
  { whitelist: ["user"] }
);

const conversationTransform = createTransform(
  (inboundState) => ({
    direct_chat: inboundState.direct_chat,
    group_chat: inboundState.group_chat,
  }),
  (outboundState) => outboundState,
  { whitelist: ["conversation"] }
);

const rootPersistConfig = {
  key: "root",
  storage,
  keyPrefix: "redux-",
  whitelist: ["user", "conversation"],
  transforms: [userTransform, conversationTransform],
  autoRehydrate: false,
};

const rootReducer = combineReducers({
  user: userReducer,
  guests: guestReducer,
  conversation: conversationReducer,
  call: callReducer,
});

// Create a wrapper to reset the state
const rootReducerWithReset = (state, action) => {
  if (action.type === RESET_STATE) {
    state = undefined; // Reset the entire state to its initial value
  } else if (action.type === RESET_DIRECT_CHAT) {
    state = {
      ...state,
      conversation: {
        ...state.conversation,
        direct_chat: {
          ...state.conversation.direct_chat,
          current_conversation: null,
        }, // Reset direct_chat to its initial state
      },
    };
  } else if (action.type === RESET_GROUP_CHAT) {
    state = {
      ...state,
      conversation: {
        ...state.conversation,
        group_chat: {
          ...state.conversation.group_chat,
          current_group: null,
        },
      },
    };
  }
  return rootReducer(state, action);
};

export { rootReducer, rootPersistConfig, rootReducerWithReset };
