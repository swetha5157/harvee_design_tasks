import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../api/client'

export const fetchDatasets = createAsyncThunk('analytics/fetchDatasets', async () => {
  const res = await api.get('/upload/datasets')
  return res.data
})

export const uploadDataset = createAsyncThunk('analytics/uploadDataset', async (file) => {
  const res = await api.upload('/upload', file)
  return res.data
})

export const deleteDataset = createAsyncThunk('analytics/deleteDataset', async (id) => {
  await api.delete(`/upload/${id}`)
  return id
})

export const runNaturalQuery = createAsyncThunk('analytics/runQuery', async ({ dataset_id, question }) => {
  const res = await api.post('/query', { dataset_id, question })
  return { question, ...res.data }
})

export const fetchQueryHistory = createAsyncThunk('analytics/fetchHistory', async (datasetId) => {
  const res = await api.get(`/query/history/${datasetId}`)
  return res.data
})

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    datasets: [],
    selectedDatasetId: null,
    queryResult: null,
    queryHistory: [],
    chatMessages: [],
    loading: false,
    actionLoading: false,
    error: null
  },
  reducers: {
    selectDataset: (state, action) => {
      state.selectedDatasetId = action.payload
      state.queryResult = null
      state.queryHistory = []
      state.chatMessages = []
    },
    clearAnalyticsError: (state) => { state.error = null },
    clearChat: (state) => { state.chatMessages = [] }
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
      .addCase(fetchDatasets.pending, setLoading)
      .addCase(fetchDatasets.fulfilled, (state, action) => {
        state.loading = false
        state.datasets = action.payload
        if (!state.selectedDatasetId && action.payload.length) {
          state.selectedDatasetId = action.payload[0].id
        }
      })
      .addCase(fetchDatasets.rejected, setError)

      .addCase(uploadDataset.pending, setActionLoading)
      .addCase(uploadDataset.fulfilled, (state, action) => {
        state.actionLoading = false
        state.datasets.unshift(action.payload)
        state.selectedDatasetId = action.payload.id
      })
      .addCase(uploadDataset.rejected, setError)

      .addCase(deleteDataset.fulfilled, (state, action) => {
        state.datasets = state.datasets.filter(d => d.id !== action.payload)
        if (state.selectedDatasetId === action.payload) {
          state.selectedDatasetId = state.datasets[0]?.id || null
        }
      })

      .addCase(runNaturalQuery.pending, setActionLoading)
      .addCase(runNaturalQuery.fulfilled, (state, action) => {
        state.actionLoading = false
        state.queryResult = action.payload
        state.chatMessages.push(
          { role: 'user', text: action.payload.question },
          { role: 'assistant', text: `SQL: ${action.payload.sql}\n\n${action.payload.rowCount} row(s) returned.` }
        )
      })
      .addCase(runNaturalQuery.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.error.message
        state.chatMessages.push(
          { role: 'assistant', text: `Error: ${action.error.message}`, isError: true }
        )
      })

      .addCase(fetchQueryHistory.fulfilled, (state, action) => {
        state.queryHistory = action.payload
      })
  }
})

export const { selectDataset, clearAnalyticsError, clearChat } = analyticsSlice.actions
export default analyticsSlice.reducer
