const pool = require('../config/db')

const createStudent = async ({ student_id, name, marks, category, application_date, preferences }) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const courseCheck = await client.query(
      'SELECT id FROM courses WHERE id = ANY($1::uuid[])',
      [preferences]
    )
    if (courseCheck.rows.length !== preferences.length) {
      const err = new Error('One or more course preferences are invalid')
      err.status = 400
      throw err
    }

    const { rows } = await client.query(
      `INSERT INTO students (student_id, name, marks, category, application_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [student_id, name, marks, category, application_date || new Date()]
    )
    const student = rows[0]
    for (let i = 0; i < preferences.length; i++) {
      await client.query(
        `INSERT INTO student_preferences (student_id, course_id, priority) VALUES ($1,$2,$3)`,
        [student.id, preferences[i], i + 1]
      )
    }
    await client.query('COMMIT')
    return student
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

const findAllWithAllocations = async () => {
  const { rows } = await pool.query(`
    SELECT s.*,
      c.name AS allocated_course,
      a.category_used,
      json_agg(
        json_build_object('priority', sp.priority, 'course_id', sp.course_id)
        ORDER BY sp.priority
      ) FILTER (WHERE sp.id IS NOT NULL) AS preferences
    FROM students s
    LEFT JOIN allocations a ON a.student_id = s.id
    LEFT JOIN courses c ON c.id = a.course_id
    LEFT JOIN student_preferences sp ON sp.student_id = s.id
    GROUP BY s.id, c.name, a.category_used
    ORDER BY s.marks DESC, s.application_date ASC
  `)
  return rows
}

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM students WHERE id=$1', [id])
  return rows[0] || null
}

const deleteById = async (id) => {
  await pool.query('DELETE FROM students WHERE id=$1', [id])
}

module.exports = { createStudent, findAllWithAllocations, findById, deleteById }