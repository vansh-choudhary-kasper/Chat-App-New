import { createSlice } from "@reduxjs/toolkit";

const callSlice = createSlice({
  name: "call",
  initialState: {
    call: false,
    whom: null,
  },
  reducers: {
    callStart: (state, action) => {
      state.call = true;
      state.whom = action.payload;
    },
    callFinsh: (state) => {
      state.call = false;
      state.whom = null;
    },
  },
});

export default callSlice.reducer;
