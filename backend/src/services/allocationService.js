const repository = require('../repositories/allocationRepository')

const buildSeatTracker = (courses) => {
  const seats = {}
  courses.forEach(c => {
    const reserved = c.general_seats + c.obc_seats + c.sc_seats + c.st_seats
    const openSeats = Math.max(0, c.total_seats - reserved)
    seats[c.id] = {
      General: c.general_seats + openSeats,
      OBC: c.obc_seats,
      SC: c.sc_seats,
      ST: c.st_seats,
      total: c.total_seats,
      used: 0
    }
  })
  return seats
}

const tryAllocateSeat = (seatTracker, courseId, category) => {
  const s = seatTracker[courseId]
  if (!s || s.used >= s.total) return null

  if (s[category] > 0) {
    s[category]--
    s.used++
    return category
  }

  if (category !== 'General' && s.General > 0) {
    s.General--
    s.used++
    return 'General'
  }

  return null
}

const runAllocation = async () => {
  const students = await repository.getStudentsWithPreferences()
  const courses = await repository.getAllCourses()
  const seats = buildSeatTracker(courses)

  await repository.clearAllocations()

  let allocated = 0
  let unallocated = 0
  const allocationRows = []

  for (const student of students) {
    let gotSeat = false

    for (const pref of student.preferences) {
      const categoryUsed = tryAllocateSeat(seats, pref.course_id, student.category)
      if (!categoryUsed) continue

      allocationRows.push({
        student_id: student.id,
        course_id: pref.course_id,
        category_used: categoryUsed,
        preference_priority: pref.priority
      })
      gotSeat = true
      allocated++
      break
    }

    if (!gotSeat) unallocated++
  }

  if (allocationRows.length) {
    await repository.bulkInsertAllocations(allocationRows)
  }

  return { allocated, unallocated, total: students.length }
}

const getAllAllocations = () => repository.findAllWithDetails()
const getStats = () => repository.getCategoryStats()
const getUnallocated = () => repository.getUnallocatedStudents()
const getDashboard = () => repository.getDashboardStats()
const resetAllocations = () => repository.clearAllocations()

module.exports = {
  runAllocation,
  getAllAllocations,
  getStats,
  getUnallocated,
  getDashboard,
  resetAllocations
}
