import { useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchDashboard, runAllocation, fetchAllocations } from '../store/slices/allocationSlice'
import StatCard from '../components/StatCard'
import DataTable from '../components/DataTable'

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626']

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const { dashboard, allocations, loading, actionLoading, error, lastRunResult } =
    useAppSelector(state => state.allocation)

  useEffect(() => {
    dispatch(fetchDashboard())
    dispatch(fetchAllocations())
  }, [dispatch])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const handleRun = async () => {
    try {
      const result = await dispatch(runAllocation()).unwrap()
      toast.success(`Allocated ${result.allocated} / ${result.total} students`)
      dispatch(fetchDashboard())
      dispatch(fetchAllocations())
    } catch (err) {
      toast.error(err.message)
    }
  }

  const totals = dashboard?.totals
  const courseChart = dashboard?.courseSummary?.map(c => ({
    name: c.course,
    allocated: c.allocated,
    available: c.available_seats
  })) || []

  const categoryChart = dashboard?.categoryStats?.reduce((acc, item) => {
    const existing = acc.find(x => x.category === item.category)
    if (existing) existing.count += item.count
    else acc.push({ category: item.category, count: item.count })
    return acc
  }, []) || []

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Allocation Dashboard</h2>
          <p>Overview of seats, allocations, and category distribution.</p>
        </div>
        <button className="btn primary" onClick={handleRun} disabled={actionLoading}>
          {actionLoading ? 'Running...' : 'Run Allocation'}
        </button>
      </div>

      {lastRunResult && (
        <div className="banner success">
          Last run: {lastRunResult.allocated} allocated, {lastRunResult.unallocated} unallocated
        </div>
      )}

      <div className="stats-grid">
        <StatCard label="Total Students" value={totals?.total_students} />
        <StatCard label="Allocated" value={totals?.total_allocated} />
        <StatCard label="Unallocated" value={totals ? totals.total_students - totals.total_allocated : '—'} />
        <StatCard label="Courses" value={totals?.total_courses} />
      </div>

      {loading && !dashboard ? (
        <div className="empty-state">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid-2">
            <section className="panel">
              <h3>Seats by Course</h3>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={courseChart}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="allocated" fill="#2563eb" name="Allocated" />
                    <Bar dataKey="available" fill="#cbd5e1" name="Available" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel">
              <h3>Category-wise Allocation</h3>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categoryChart} dataKey="count" nameKey="category" outerRadius={90} label>
                      {categoryChart.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="panel">
            <h3>Course Statistics</h3>
            <DataTable
              columns={[
                { key: 'course', label: 'Course' },
                { key: 'total_seats', label: 'Total Seats' },
                { key: 'allocated', label: 'Allocated' },
                { key: 'available_seats', label: 'Available' }
              ]}
              rows={dashboard?.courseSummary || []}
            />
          </section>

          <section className="panel">
            <h3>Recent Allocations</h3>
            <DataTable
              columns={[
                { key: 'student_code', label: 'Student ID' },
                { key: 'student_name', label: 'Name' },
                { key: 'course_name', label: 'Course' },
                { key: 'category', label: 'Category' },
                { key: 'category_used', label: 'Seat Used' },
                {
                  key: 'first_preference_met',
                  label: '1st Pref',
                  render: row => row.first_preference_met ? 'Yes' : 'No'
                }
              ]}
              rows={allocations}
              emptyText="Run allocation to see results"
            />
          </section>
        </>
      )}
    </div>
  )
}
