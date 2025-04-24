import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./chatSlice";
import documentsReducer from "./documentsSlice";

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    documents: documentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
