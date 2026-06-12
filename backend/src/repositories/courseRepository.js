const pool = require('../config/db')

const create = async ({ name, code, total_seats, general_seats, obc_seats, sc_seats, st_seats }) => {
  const { rows } = await pool.query(
    `INSERT INTO courses (name, code, total_seats, general_seats, obc_seats, sc_seats, st_seats)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [name, code, total_seats, general_seats, obc_seats, sc_seats, st_seats]
  )
  return rows[0]
}

const findAllWithStats = async () => {
  const { rows } = await pool.query(`
    SELECT c.*,
      COALESCE(COUNT(a.id),0)::int AS allocated_count,
      (c.total_seats - COALESCE(COUNT(a.id),0))::int AS available_seats
    FROM courses c
    LEFT JOIN allocations a ON a.course_id = c.id
    GROUP BY c.id ORDER BY c.name
  `)
  return rows
}

const deleteById = async (id) => {
  await pool.query('DELETE FROM courses WHERE id=$1', [id])
}

module.exports = { create, findAllWithStats, deleteById }