const repository = require('../repositories/studentRepository')

const registerStudent = async ({ student_id, name, marks, category, application_date, preferences }) => {
  if (!student_id || !name || marks === undefined || !category) {
    const err = new Error('student_id, name, marks, category are required')
    err.status = 400
    throw err
  }
  if (marks < 0 || marks > 100) {
    const err = new Error('Marks must be between 0 and 100')
    err.status = 400
    throw err
  }
  if (!['General', 'OBC', 'SC', 'ST'].includes(category)) {
    const err = new Error('category must be General, OBC, SC, or ST')
    err.status = 400
    throw err
  }
  const validPrefs = (preferences || []).filter(Boolean).slice(0, 3)
  if (!validPrefs.length) {
    const err = new Error('At least one course preference is required')
    err.status = 400
    throw err
  }
  return repository.createStudent({ student_id, name, marks, category, application_date, preferences: validPrefs })
}

const getAllStudents = () => repository.findAllWithAllocations()
const getStudentById = (id) => repository.findById(id)
const deleteStudent = (id) => repository.deleteById(id)

module.exports = { registerStudent, getAllStudents, getStudentById, deleteStudent }