import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  fetchDashboard,
  fetchAllocations,
  runAllocation,
  resetAllocations
} from '../store/slices/allocationSlice'
import DataTable from '../components/DataTable'

export default function AllocationsPage() {
  const dispatch = useAppDispatch()
  const { dashboard, allocations, actionLoading, lastRunResult } = useAppSelector(state => state.allocation)

  useEffect(() => {
    dispatch(fetchDashboard())
    dispatch(fetchAllocations())
  }, [dispatch])

  const refresh = () => {
    dispatch(fetchDashboard())
    dispatch(fetchAllocations())
  }

  const handleRun = async () => {
    try {
      await dispatch(runAllocation()).unwrap()
      toast.success('Allocation completed')
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleReset = async () => {
    if (!confirm('Clear all allocations?')) return
    try {
      await dispatch(resetAllocations()).unwrap()
      toast.success('Allocations reset')
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Allocation Processing</h2>
          <p>Run the allocation engine and review outcomes.</p>
        </div>
        <div className="actions">
          <button className="btn" onClick={handleReset}>Reset</button>
          <button className="btn primary" onClick={handleRun} disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Run Allocation'}
          </button>
        </div>
      </div>

      {lastRunResult && (
        <div className="banner">
          Result: {lastRunResult.allocated} allocated, {lastRunResult.unallocated} unallocated out of {lastRunResult.total}
        </div>
      )}

      <section className="panel">
        <h3>Allocated Students</h3>
        <DataTable
          columns={[
            { key: 'student_code', label: 'Student ID' },
            { key: 'student_name', label: 'Name' },
            { key: 'marks', label: 'Marks' },
            { key: 'course_name', label: 'Course' },
            { key: 'category_used', label: 'Seat Category' },
            { key: 'preference_priority', label: 'Pref #' }
          ]}
          rows={allocations}
          emptyText="No allocations yet"
        />
      </section>

      <section className="panel">
        <h3>Students Not Getting First Preference</h3>
        <DataTable
          columns={[
            { key: 'student_id', label: 'Student ID' },
            { key: 'name', label: 'Name' },
            { key: 'first_preference', label: 'Wanted' },
            { key: 'allocated_course', label: 'Got' }
          ]}
          rows={dashboard?.studentsNotFirstPreference || []}
          emptyText="All allocated students got their first preference"
        />
      </section>

      <section className="panel">
        <h3>Course Rejection Rates</h3>
        <DataTable
          columns={[
            { key: 'course', label: 'Course' },
            { key: 'total_applicants', label: 'Applicants' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'rejection_rate_pct', label: 'Rejection %', render: row => `${row.rejection_rate_pct}%` }
          ]}
          rows={dashboard?.rejectionRates || []}
        />
      </section>

      <section className="panel">
        <h3>Unallocated Students</h3>
        <DataTable
          columns={[
            { key: 'student_id', label: 'Student ID' },
            { key: 'name', label: 'Name' },
            { key: 'marks', label: 'Marks' },
            { key: 'category', label: 'Category' }
          ]}
          rows={dashboard?.unallocatedStudents || []}
          emptyText="All students allocated"
        />
      </section>
    </div>
  )
}
