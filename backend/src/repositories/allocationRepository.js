const pool = require('../config/db')

const getStudentsWithPreferences = async () => {
  const { rows } = await pool.query(`
    SELECT s.*,
      json_agg(
        json_build_object('course_id', sp.course_id, 'priority', sp.priority)
        ORDER BY sp.priority ASC
      ) AS preferences
    FROM students s
    JOIN student_preferences sp ON sp.student_id = s.id
    GROUP BY s.id
    ORDER BY s.marks DESC, s.application_date ASC
  `)
  return rows
}

const getAllCourses = async () => {
  const { rows } = await pool.query('SELECT * FROM courses ORDER BY name')
  return rows
}

const clearAllocations = async () => {
  await pool.query('DELETE FROM allocations')
}

const bulkInsertAllocations = async (rows) => {
  if (!rows.length) return
  const values = rows.flatMap(r => [r.student_id, r.course_id, r.category_used, r.preference_priority])
  const placeholders = rows.map((_, i) =>
    `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
  ).join(', ')
  await pool.query(
    `INSERT INTO allocations (student_id, course_id, category_used, preference_priority)
     VALUES ${placeholders}`,
    values
  )
}

const findAllWithDetails = async () => {
  const { rows } = await pool.query(`
    SELECT a.*, s.name AS student_name, s.student_id AS student_code,
           s.marks, s.category, c.name AS course_name,
           CASE WHEN a.preference_priority = 1 THEN true ELSE false END AS first_preference_met
    FROM allocations a
    JOIN students s ON s.id = a.student_id
    JOIN courses c ON c.id = a.course_id
    ORDER BY c.name, s.marks DESC
  `)
  return rows
}

const getCategoryStats = async () => {
  const { rows } = await pool.query(`
    SELECT c.name AS course, a.category_used AS category, COUNT(*)::int AS count
    FROM allocations a
    JOIN courses c ON c.id = a.course_id
    GROUP BY c.name, a.category_used
    ORDER BY c.name, a.category_used
  `)
  return rows
}

const getUnallocatedStudents = async () => {
  const { rows } = await pool.query(`
    SELECT s.*,
      (SELECT json_agg(json_build_object('priority', sp.priority, 'course', co.name) ORDER BY sp.priority)
       FROM student_preferences sp
       JOIN courses co ON co.id = sp.course_id
       WHERE sp.student_id = s.id) AS preferences
    FROM students s
    LEFT JOIN allocations a ON a.student_id = s.id
    WHERE a.id IS NULL
    ORDER BY s.marks DESC, s.application_date ASC
  `)
  return rows
}

const getCourseAllocationSummary = async () => {
  const { rows } = await pool.query(`
    SELECT c.name AS course, c.code, c.total_seats,
      COUNT(a.id)::int AS allocated,
      (c.total_seats - COUNT(a.id)::int)::int AS available_seats
    FROM courses c
    LEFT JOIN allocations a ON a.course_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `)
  return rows
}

const getStudentsNotFirstPreference = async () => {
  const { rows } = await pool.query(`
    SELECT s.student_id, s.name, s.marks, s.category,
      c_allocated.name AS allocated_course,
      c_first.name AS first_preference,
      a.preference_priority AS preference_matched
    FROM allocations a
    JOIN students s ON s.id = a.student_id
    JOIN courses c_allocated ON c_allocated.id = a.course_id
    JOIN student_preferences sp ON sp.student_id = s.id AND sp.priority = 1
    JOIN courses c_first ON c_first.id = sp.course_id
    WHERE a.course_id != sp.course_id
    ORDER BY s.marks DESC
  `)
  return rows
}

const getCourseRejectionRates = async () => {
  const { rows } = await pool.query(`
    WITH applicants AS (
      SELECT sp.course_id, sp.student_id
      FROM student_preferences sp
    ),
    rejected AS (
      SELECT ap.course_id, ap.student_id
      FROM applicants ap
      LEFT JOIN allocations al
        ON al.student_id = ap.student_id AND al.course_id = ap.course_id
      WHERE al.id IS NULL
    )
    SELECT c.name AS course,
      COUNT(DISTINCT ap.student_id)::int AS total_applicants,
      COUNT(DISTINCT r.student_id)::int AS rejected,
      ROUND(
        COUNT(DISTINCT r.student_id)::numeric /
        NULLIF(COUNT(DISTINCT ap.student_id), 0) * 100, 2
      ) AS rejection_rate_pct
    FROM courses c
    JOIN applicants ap ON ap.course_id = c.id
    LEFT JOIN rejected r ON r.course_id = ap.course_id AND r.student_id = ap.student_id
    GROUP BY c.id, c.name
    HAVING COUNT(DISTINCT ap.student_id) > 0
    ORDER BY rejection_rate_pct DESC, c.name
  `)
  return rows
}

const getDashboardStats = async () => {
  const [summary, categoryStats, notFirstPref, rejectionRates, unallocated] = await Promise.all([
    getCourseAllocationSummary(),
    getCategoryStats(),
    getStudentsNotFirstPreference(),
    getCourseRejectionRates(),
    getUnallocatedStudents()
  ])

  const { rows: totals } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM students)::int AS total_students,
      (SELECT COUNT(*) FROM allocations)::int AS total_allocated,
      (SELECT COUNT(*) FROM courses)::int AS total_courses
  `)

  return {
    totals: totals[0],
    courseSummary: summary,
    categoryStats,
    studentsNotFirstPreference: notFirstPref,
    rejectionRates,
    unallocatedStudents: unallocated
  }
}

module.exports = {
  getStudentsWithPreferences,
  getAllCourses,
  clearAllocations,
  bulkInsertAllocations,
  findAllWithDetails,
  getCategoryStats,
  getUnallocatedStudents,
  getCourseAllocationSummary,
  getStudentsNotFirstPreference,
  getCourseRejectionRates,
  getDashboardStats
}
