const service = require('../services/studentService')

const registerStudent = async (req, res) => {
  const student = await service.registerStudent(req.body)
  res.status(201).json({ success: true, data: student })
}

const getAllStudents = async (req, res) => {
  const students = await service.getAllStudents()
  res.json({ success: true, data: students })
}

const getStudentById = async (req, res) => {
  const student = await service.getStudentById(req.params.id)
  if (!student) return res.status(404).json({ error: 'Student not found' })
  res.json({ success: true, data: student })
}

const deleteStudent = async (req, res) => {
  await service.deleteStudent(req.params.id)
  res.json({ success: true })
}

module.exports = { registerStudent, getAllStudents, getStudentById, deleteStudent }