const pool = require('../config/db')

const findDatasetById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM uploaded_datasets WHERE id=$1', [id])
  return rows[0] || null
}

const saveHistory = async (dataset_id, natural_language, generated_sql, status) => {
  await pool.query(
    `INSERT INTO query_history (dataset_id, natural_language, generated_sql, status)
     VALUES ($1,$2,$3,$4)`,
    [dataset_id, natural_language, generated_sql, status]
  )
}

const findHistory = async (dataset_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM query_history WHERE dataset_id=$1 ORDER BY created_at DESC LIMIT 20`,
    [dataset_id]
  )
  return rows
}

module.exports = { findDatasetById, saveHistory, findHistory }