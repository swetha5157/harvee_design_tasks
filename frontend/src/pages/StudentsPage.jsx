import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchStudents, fetchCourses, registerStudent, deleteStudent } from '../store/slices/allocationSlice'
import DataTable from '../components/DataTable'

const emptyForm = {
  student_id: '',
  name: '',
  marks: '',
  category: 'General',
  application_date: new Date().toISOString().slice(0, 10),
  pref1: '',
  pref2: '',
  pref3: ''
}

export default function StudentsPage() {
  const dispatch = useAppDispatch()
  const { students, courses, loading, actionLoading } = useAppSelector(state => state.allocation)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    dispatch(fetchStudents())
    dispatch(fetchCourses())
  }, [dispatch])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const preferences = [form.pref1, form.pref2, form.pref3].filter(Boolean)
    if (!preferences.length) return toast.error('Select at least one course preference')

    try {
      await dispatch(registerStudent({
        student_id: form.student_id,
        name: form.name,
        marks: Number(form.marks),
        category: form.category,
        application_date: form.application_date,
        preferences
      })).unwrap()
      toast.success('Student registered')
      setForm(emptyForm)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteStudent(id)).unwrap()
      toast.success('Student deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Student Registration</h2>
          <p>Register applicants with marks, category, and up to 3 course preferences.</p>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h3>Add Student</h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Student ID
              <input name="student_id" value={form.student_id} onChange={handleChange} required />
            </label>
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              Marks
              <input name="marks" type="number" min="0" max="100" value={form.marks} onChange={handleChange} required />
            </label>
            <label>
              Category
              <select name="category" value={form.category} onChange={handleChange}>
                {['General', 'OBC', 'SC', 'ST'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Application Date
              <input name="application_date" type="date" value={form.application_date} onChange={handleChange} required />
            </label>
            <label>
              Preference 1
              <select name="pref1" value={form.pref1} onChange={handleChange} required>
                <option value="">Select course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>
              Preference 2
              <select name="pref2" value={form.pref2} onChange={handleChange}>
                <option value="">Optional</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>
              Preference 3
              <select name="pref3" value={form.pref3} onChange={handleChange}>
                <option value="">Optional</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <button className="btn primary" type="submit" disabled={actionLoading || !courses.length}>
              Register Student
            </button>
          </form>
        </section>

        <section className="panel">
          <h3>Registered Students</h3>
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : (
            <DataTable
              columns={[
                { key: 'student_id', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'marks', label: 'Marks' },
                { key: 'category', label: 'Category' },
                { key: 'allocated_course', label: 'Allocated', render: row => row.allocated_course || '—' },
                {
                  key: 'actions',
                  label: '',
                  render: row => (
                    <button className="btn danger small" onClick={() => handleDelete(row.id)}>Delete</button>
                  )
                }
              ]}
              rows={students}
            />
          )}
        </section>
      </div>
    </div>
  )
}
