const pool = require('../config/db')
const { v4: uuidv4 } = require('uuid')

const normalizeValue = (value, type) => {
  if (value === null || value === undefined || String(value).trim() === '') return null
  if (type === 'BIGINT' || type === 'FLOAT') {
    const num = Number(value)
    return Number.isNaN(num) ? null : num
  }
  return String(value)
}

const createDatasetTable = async (originalFilename, columns, rows) => {
  const tableName = 'ds_' + uuidv4().replace(/-/g, '').slice(0, 12)
  const colDefs = columns.map(c => `"${c.sanitized}" ${c.type}`).join(', ')

  await pool.query(`CREATE TABLE "${tableName}" (${colDefs})`)

  // Batch insert rows
  const BATCH = 500
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const values = []
    const placeholders = batch.map((row, ri) => {
      const ph = columns.map((col, ci) => {
        values.push(normalizeValue(row[col.original], col.type))
        return `$${ri * columns.length + ci + 1}`
      })
      return `(${ph.join(', ')})`
    })
    await pool.query(
      `INSERT INTO "${tableName}" (${columns.map(c => `"${c.sanitized}"`).join(', ')})
       VALUES ${placeholders.join(', ')}`,
      values
    )
  }

  const { rows: saved } = await pool.query(
    `INSERT INTO uploaded_datasets (original_filename, table_name, schema_info, row_count)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [originalFilename, tableName, JSON.stringify(columns), rows.length]
  )
  return saved[0]
}

const findAll = async () => {
  const { rows } = await pool.query(
    'SELECT * FROM uploaded_datasets ORDER BY uploaded_at DESC'
  )
  return rows
}

const deleteById = async (id) => {
  const { rows } = await pool.query('SELECT table_name FROM uploaded_datasets WHERE id=$1', [id])
  if (rows[0]) {
    await pool.query(`DROP TABLE IF EXISTS "${rows[0].table_name}"`)
    await pool.query('DELETE FROM uploaded_datasets WHERE id=$1', [id])
  }
}

module.exports = { createDatasetTable, findAll, deleteById }