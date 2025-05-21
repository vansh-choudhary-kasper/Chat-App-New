import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Base_Url } from "../../utils/config";
// import axios from "axios";
import { axios } from "../../utils/apiInterceptor";

const guestSlice = createSlice({
  name: "guest",
  initialState: {
    loading: false,
    error: null,
    guests: null,
    user: null,
    userLoading: null,
    userError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.guests = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchCurrentUser.pending, (state, action) => {
        state.userLoading = true;
        state.userError = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.userLoading = false;
        state.userError = null;

        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.userLoading = false;
        state.userError = action.payload;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.updatingUser = true;
        state.updateUserError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        const { data } = action.payload;
        state.updatingUser = false;
        state.updateUserError = null;
        state.user.firstname = data.firstname;
        state.user.lastname = data.lastname;
        state.user.about = data.about;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updatingUser = false;
        state.updateUserError = action.payload;
      });
  },
});

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async ({ query, userId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${Base_Url}/api/user/users?search=${query}&user=${userId}`,
        {
          headers: {
            authorization: token,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      console.log("error");
      return rejectWithValue("Error fetching users");
    }
  }
);
export const fetchCurrentUser = createAsyncThunk(
  "users/fetchCurrentUser",
  async ({ userId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${Base_Url}/api/user/user?search=${userId}`,
        {
          headers: {
            authorization: token,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue("Error fetching users");
    }
  }
);
export const verifyUser = createAsyncThunk(
  "users/verifyUser",
  async ({ userid, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${Base_Url}/api/user/verify?user=${userid}`,
        {
          headers: {
            authorization: token,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue("Error fetching users");
    }
  }
);
export const updateUserProfile = createAsyncThunk(
  "user/updateUserProfile",
  async ({ formData, token }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${Base_Url}/api/auth/profile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: token,
          },
        }
      );
      return response.data; // Return updated user data
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
export default guestSlice.reducer;
