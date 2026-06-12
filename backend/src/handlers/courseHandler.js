const service = require('../services/courseService')

const createCourse = async (req, res) => {
  const course = await service.createCourse(req.body)
  res.status(201).json({ success: true, data: course })
}

const getAllCourses = async (req, res) => {
  const courses = await service.getAllCourses()
  res.json({ success: true, data: courses })
}

const deleteCourse = async (req, res) => {
  await service.deleteCourse(req.params.id)
  res.json({ success: true })
}

module.exports = { createCourse, getAllCourses, deleteCourse }