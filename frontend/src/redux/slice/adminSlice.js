import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { Base_Url } from "../../utils/config";

export const fetchAdminData = createAsyncThunk(
  "admin/fetchAdminData",
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${Base_Url}/api/admin/data`, {
        headers: {
          authorization: token,
        },
      });
      console.error("response", response);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(fetchAdminData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default adminSlice.reducer;
