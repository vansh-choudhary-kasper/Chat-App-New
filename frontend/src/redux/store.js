import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { rootPersistConfig, rootReducerWithReset } from "./rootReducers";

const store = configureStore({
  reducer: persistReducer(rootPersistConfig, rootReducerWithReset), // Use the reset-capable reducer
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

const persistor = persistStore(store);

export { store, persistor };
