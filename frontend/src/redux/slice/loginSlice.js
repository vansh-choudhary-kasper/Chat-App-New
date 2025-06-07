import {createSlice,createAsyncThunk} from"@reduxjs/toolkit";
import {Base_Url} from "../../utils/config";
// import axios from "axios"
import { axios } from "../../utils/apiInterceptor";
import Cookies from "js-cookie";

const userSlice = createSlice({
    name: "user",
    initialState: {
      loading: false,
      error: null,
      register: null,
      login: null,
    },
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(registerHandler.pending, (state) => {
          state.loading = true;
          state.error=null;
          
    
        })
        .addCase(registerHandler.fulfilled, (state, action) => {
          state.register = action.payload;
          state.loading = false;
          state.error=null;
      
        })
        .addCase(registerHandler.rejected, (state, action) => {
          state.error = action.payload; 
          state.loading = false;
        }) .addCase(loginHandler.pending, (state, action) => {

          state.loading = true;
          state.error=null;
        }).addCase(loginHandler.fulfilled, (state, action) => {
        
          state.login = action.payload;
          state.loading = false;
          state.error=null;
          const { userId, token, access } = action.payload;
          Cookies.set("user", JSON.stringify({ userId, token, access }), { expires: 1 }); 
      
        }).addCase(loginHandler.rejected, (state, action) => {
          if(state.error){
            state.error=null;
            state.error = action.payload; 
          }
          state.error = action.payload; 
          state.loading = false;
        }).addCase(logoutHandler.pending, (state, action) => {

          state.loading = true;
        }).addCase(logoutHandler.fulfilled, (state, action) => {
          state.login = null;
          state.loading = false;
          state.error=null;

          Cookies.remove("user"); // Clear user data from cookies
      
        }).addCase(logoutHandler.rejected, (state, action) => {
          state.error = action.payload; 
          state.loading = false;
        })
    },
  });
  


export const registerHandler =createAsyncThunk("user/registerHandler",async({formData,token}, thunkAPI)=>{
  
    try {
        const response=  await axios.post(`${Base_Url}/api/auth/register`, formData,{
          headers:{
            authorization:token
          }
        });
        
        return response.data.data
    } catch (error) {
     
        return thunkAPI.rejectWithValue(error.response?.data?.message || "register failed");
    }

})
export const loginHandler =createAsyncThunk("user/loginHandler",async(data, thunkAPI)=>{
  try {

      const response=  await axios.post(`${Base_Url}/api/auth/login`, data);
  
      return response.data.data
  } catch (error) {
     
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
  }

})

export const logoutHandler =createAsyncThunk("user/logoutHandler",async(data, thunkAPI)=>{
  try {

      const response=  await axios.get(`${Base_Url}/api/auth/logout?user=${data}`);
  
      return response.data.data
  } catch (error) {
     
      return thunkAPI.rejectWithValue(error.response?.data?.message || "register failed");
  }

})
export const forgotHandler = createAsyncThunk("user/forgotHandler", async(data,thunkAPI)=>{
  try {

    const response=  await axios.post(`${Base_Url}/api/auth/send-otp?user_mail=${data}`, {});

    return response.data.data
} catch (error) {
   
    return thunkAPI.rejectWithValue(error.response?.data?.message || "register failed");
}
})
export const otpHandler = createAsyncThunk("user/otpHandler", async(data,thunkAPI)=>{
  try {

    const response=  await axios.post(`${Base_Url}/api/auth/verifyOtp`,data);

    return response.data.data
} catch (error) {
   
    return thunkAPI.rejectWithValue(error.response?.data?.message || "register failed");
}
})
export default userSlice.reducer;