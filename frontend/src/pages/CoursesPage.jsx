import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchCourses, createCourse, deleteCourse } from '../store/slices/allocationSlice'
import DataTable from '../components/DataTable'

const emptyForm = {
  name: '',
  code: '',
  total_seats: '',
  general_seats: '',
  obc_seats: '',
  sc_seats: '',
  st_seats: ''
}

export default function CoursesPage() {
  const dispatch = useAppDispatch()
  const { courses, loading, actionLoading } = useAppSelector(state => state.allocation)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    dispatch(fetchCourses())
  }, [dispatch])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await dispatch(createCourse({
        name: form.name,
        code: form.code,
        total_seats: Number(form.total_seats),
        general_seats: Number(form.general_seats || 0),
        obc_seats: Number(form.obc_seats || 0),
        sc_seats: Number(form.sc_seats || 0),
        st_seats: Number(form.st_seats || 0)
      })).unwrap()
      toast.success('Course created')
      setForm(emptyForm)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteCourse(id)).unwrap()
      toast.success('Course deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Course Management</h2>
          <p>Create courses with total seats and category-wise reservation.</p>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h3>Add Course</h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Course Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              Course Code
              <input name="code" value={form.code} onChange={handleChange} required />
            </label>
            <label>
              Total Seats
              <input name="total_seats" type="number" min="1" value={form.total_seats} onChange={handleChange} required />
            </label>
            <label>General Seats<input name="general_seats" type="number" min="0" value={form.general_seats} onChange={handleChange} /></label>
            <label>OBC Seats<input name="obc_seats" type="number" min="0" value={form.obc_seats} onChange={handleChange} /></label>
            <label>SC Seats<input name="sc_seats" type="number" min="0" value={form.sc_seats} onChange={handleChange} /></label>
            <label>ST Seats<input name="st_seats" type="number" min="0" value={form.st_seats} onChange={handleChange} /></label>
            <button className="btn primary" type="submit" disabled={actionLoading}>Create Course</button>
          </form>
        </section>

        <section className="panel">
          <h3>Courses</h3>
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : (
            <DataTable
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'code', label: 'Code' },
                { key: 'total_seats', label: 'Total' },
                { key: 'allocated_count', label: 'Allocated' },
                { key: 'available_seats', label: 'Available' },
                {
                  key: 'actions',
                  label: '',
                  render: row => (
                    <button className="btn danger small" onClick={() => handleDelete(row.id)}>Delete</button>
                  )
                }
              ]}
              rows={courses}
            />
          )}
        </section>
      </div>
    </div>
  )
}
