import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../api/client'

export const fetchStudents = createAsyncThunk('allocation/fetchStudents', async () => {
  const res = await api.get('/students')
  return res.data
})

export const registerStudent = createAsyncThunk('allocation/registerStudent', async (payload) => {
  const res = await api.post('/students', payload)
  return res.data
})

export const deleteStudent = createAsyncThunk('allocation/deleteStudent', async (id) => {
  await api.delete(`/students/${id}`)
  return id
})

export const fetchCourses = createAsyncThunk('allocation/fetchCourses', async () => {
  const res = await api.get('/courses')
  return res.data
})

export const createCourse = createAsyncThunk('allocation/createCourse', async (payload) => {
  const res = await api.post('/courses', payload)
  return res.data
})

export const deleteCourse = createAsyncThunk('allocation/deleteCourse', async (id) => {
  await api.delete(`/courses/${id}`)
  return id
})

export const runAllocation = createAsyncThunk('allocation/run', async () => {
  const res = await api.post('/allocations/run')
  return res.data
})

export const fetchAllocations = createAsyncThunk('allocation/fetchAllocations', async () => {
  const res = await api.get('/allocations')
  return res.data
})

export const fetchDashboard = createAsyncThunk('allocation/fetchDashboard', async () => {
  const res = await api.get('/allocations/dashboard')
  return res.data
})

export const resetAllocations = createAsyncThunk('allocation/reset', async () => {
  await api.delete('/allocations/reset')
})

export const askAllocationAi = createAsyncThunk('allocation/askAi', async (question) => {
  const res = await api.post('/ai/ask', { question })
  return { question, answer: res.data.answer }
})

const allocationSlice = createSlice({
  name: 'allocation',
  initialState: {
    students: [],
    courses: [],
    allocations: [],
    dashboard: null,
    aiMessages: [],
    loading: false,
    actionLoading: false,
    error: null,
    lastRunResult: null
  },
  reducers: {
    clearError: (state) => { state.error = null },
    clearAiMessages: (state) => { state.aiMessages = [] }
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null }
    const setActionLoading = (state) => { state.actionLoading = true; state.error = null }
    const setError = (state, action) => {
      state.loading = false
      state.actionLoading = false
      state.error = action.error.message
    }

    builder
      .addCase(fetchStudents.pending, setLoading)
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false
        state.students = action.payload
      })
      .addCase(fetchStudents.rejected, setError)

      .addCase(registerStudent.pending, setActionLoading)
      .addCase(registerStudent.fulfilled, (state, action) => {
        state.actionLoading = false
        state.students.unshift(action.payload)
      })
      .addCase(registerStudent.rejected, setError)

      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.students = state.students.filter(s => s.id !== action.payload)
      })

      .addCase(fetchCourses.pending, setLoading)
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false
        state.courses = action.payload
      })
      .addCase(fetchCourses.rejected, setError)

      .addCase(createCourse.pending, setActionLoading)
      .addCase(createCourse.fulfilled, (state, action) => {
        state.actionLoading = false
        state.courses.push(action.payload)
      })
      .addCase(createCourse.rejected, setError)

      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.courses = state.courses.filter(c => c.id !== action.payload)
      })

      .addCase(runAllocation.pending, setActionLoading)
      .addCase(runAllocation.fulfilled, (state, action) => {
        state.actionLoading = false
        state.lastRunResult = action.payload
      })
      .addCase(runAllocation.rejected, setError)

      .addCase(fetchAllocations.fulfilled, (state, action) => {
        state.allocations = action.payload
      })

      .addCase(fetchDashboard.pending, setLoading)
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false
        state.dashboard = action.payload
      })
      .addCase(fetchDashboard.rejected, setError)

      .addCase(resetAllocations.fulfilled, (state) => {
        state.allocations = []
        state.dashboard = null
        state.lastRunResult = null
      })

      .addCase(askAllocationAi.pending, setActionLoading)
      .addCase(askAllocationAi.fulfilled, (state, action) => {
        state.actionLoading = false
        state.aiMessages.push(
          { role: 'user', text: action.payload.question },
          { role: 'assistant', text: action.payload.answer }
        )
      })
      .addCase(askAllocationAi.rejected, setError)
  }
})

export const { clearError, clearAiMessages } = allocationSlice.actions
export default allocationSlice.reducer
