import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  fetchDatasets,
  uploadDataset,
  deleteDataset,
  selectDataset,
  runNaturalQuery,
  fetchQueryHistory,
  clearChat
} from '../store/slices/analyticsSlice'
import ChatPanel from '../components/ChatPanel'
import DataTable from '../components/DataTable'

const suggestions = [
  'Show top 10 records',
  'Find records with missing values',
  'Show duplicate records',
  'Generate a summary count by each column'
]

export default function AnalyticsPage() {
  const dispatch = useAppDispatch()
  const fileRef = useRef(null)
  const {
    datasets,
    selectedDatasetId,
    queryResult,
    queryHistory,
    chatMessages,
    loading,
    actionLoading
  } = useAppSelector(state => state.analytics)

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId)

  useEffect(() => {
    dispatch(fetchDatasets())
  }, [dispatch])

  useEffect(() => {
    if (selectedDatasetId) dispatch(fetchQueryHistory(selectedDatasetId))
  }, [dispatch, selectedDatasetId])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await dispatch(uploadDataset(file)).unwrap()
      toast.success('Dataset uploaded')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this dataset?')) return
    try {
      await dispatch(deleteDataset(id)).unwrap()
      toast.success('Dataset deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleQuery = async (question) => {
    if (!selectedDatasetId) return toast.error('Select a dataset first')
    try {
      await dispatch(runNaturalQuery({ dataset_id: selectedDatasetId, question })).unwrap()
      dispatch(fetchQueryHistory(selectedDatasetId))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const resultColumns = queryResult?.rows?.length
    ? Object.keys(queryResult.rows[0]).map(key => ({ key, label: key }))
    : queryResult?.columns?.map(key => ({ key, label: key })) || []

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>AI SQL Analytics</h2>
          <p>Upload CSV/Excel datasets and query them using natural language.</p>
        </div>
        <button className="btn" onClick={() => dispatch(clearChat())}>Clear Chat</button>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h3>Upload Dataset</h3>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} />
          <p className="hint">Supported formats: CSV, XLSX, XLS (max 10MB)</p>

          <h3 className="section-gap">Your Datasets</h3>
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : !datasets.length ? (
            <div className="empty-state">No datasets uploaded yet</div>
          ) : (
            <div className="dataset-list">
              {datasets.map(d => (
                <div
                  key={d.id}
                  className={`dataset-item ${selectedDatasetId === d.id ? 'active' : ''}`}
                  onClick={() => dispatch(selectDataset(d.id))}
                >
                  <div>
                    <strong>{d.original_filename}</strong>
                    <span>{d.row_count} rows · {d.table_name}</span>
                  </div>
                  <button
                    className="btn danger small"
                    onClick={(e) => { e.stopPropagation(); handleDelete(d.id) }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h3>Natural Language Query</h3>
          {selectedDataset ? (
            <p className="hint">Selected: {selectedDataset.original_filename}</p>
          ) : (
            <p className="hint">Upload or select a dataset to begin</p>
          )}
          <ChatPanel
            messages={chatMessages}
            loading={actionLoading}
            onSend={handleQuery}
            placeholder="Ask a question about your data..."
            suggestions={suggestions}
          />
        </section>
      </div>

      {queryResult && (
        <section className="panel">
          <h3>Query Result</h3>
          <div className="sql-box">
            <strong>Generated SQL</strong>
            <pre>{queryResult.sql}</pre>
          </div>
          <DataTable columns={resultColumns} rows={queryResult.rows || []} />
        </section>
      )}

      {!!queryHistory.length && (
        <section className="panel">
          <h3>Query History</h3>
          <DataTable
            columns={[
              { key: 'natural_language', label: 'Question' },
              { key: 'generated_sql', label: 'SQL' },
              { key: 'status', label: 'Status' },
              {
                key: 'created_at',
                label: 'Time',
                render: row => new Date(row.created_at).toLocaleString()
              }
            ]}
            rows={queryHistory}
          />
        </section>
      )}
    </div>
  )
}
