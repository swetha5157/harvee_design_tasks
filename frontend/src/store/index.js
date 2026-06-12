import { configureStore } from '@reduxjs/toolkit'
import allocationReducer from './slices/allocationSlice'
import analyticsReducer from './slices/analyticsSlice'

export const store = configureStore({
  reducer: {
    allocation: allocationReducer,
    analytics: analyticsReducer
  }
})
