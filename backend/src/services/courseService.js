const repository = require('../repositories/courseRepository')

const createCourse = async (body) => {
  const { name, code, total_seats, general_seats, obc_seats, sc_seats, st_seats } = body
  if (!name || !code || !total_seats) {
    const err = new Error('name, code, total_seats are required')
    err.status = 400
    throw err
  }
  const reserved = (general_seats || 0) + (obc_seats || 0) + (sc_seats || 0) + (st_seats || 0)
  if (reserved > total_seats) {
    const err = new Error('Reserved seats cannot exceed total seats')
    err.status = 400
    throw err
  }
  return repository.create({ name, code, total_seats, general_seats: general_seats || 0, obc_seats: obc_seats || 0, sc_seats: sc_seats || 0, st_seats: st_seats || 0 })
}

const getAllCourses = () => repository.findAllWithStats()
const deleteCourse = (id) => repository.deleteById(id)

module.exports = { createCourse, getAllCourses, deleteCourse }