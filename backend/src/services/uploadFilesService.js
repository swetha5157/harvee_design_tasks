const csv = require('csv-parser')
const XLSX = require('xlsx')
const { Readable } = require('stream')
const repository = require('../repositories/uploadFilesRepository')

const inferType = (values) => {
  const nonEmpty = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '')
  if (!nonEmpty.length) return 'TEXT'

  const allNumeric = nonEmpty.every(v => !isNaN(String(v).trim()))
  if (allNumeric) {
    return nonEmpty.some(v => String(v).includes('.')) ? 'FLOAT' : 'BIGINT'
  }
  return 'TEXT'
}

const sanitizeCol = (name, used) => {
  let base = name.toLowerCase().trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&')
    .slice(0, 55)

  if (!base) base = 'column'

  let sanitized = base
  let i = 1
  while (used.has(sanitized)) {
    sanitized = `${base}_${i++}`
  }
  used.add(sanitized)
  return sanitized
}

const parseCSV = (buffer) =>
  new Promise((resolve, reject) => {
    const results = []
    Readable.from(buffer)
      .pipe(csv())
      .on('data', row => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject)
  })

const parseExcel = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
}

const buildColumns = (rows) => {
  const keys = Object.keys(rows[0])
  const used = new Set()
  const sampleSize = Math.min(rows.length, 20)

  return keys.map(key => {
    const sampleValues = rows.slice(0, sampleSize).map(r => r[key])
    return {
      original: key,
      sanitized: sanitizeCol(key, used),
      type: inferType(sampleValues)
    }
  })
}

const processUpload = async (file) => {
  const ext = file.originalname.split('.').pop().toLowerCase()
  let rows = []

  if (ext === 'csv') rows = await parseCSV(file.buffer)
  else if (['xlsx', 'xls'].includes(ext)) rows = parseExcel(file.buffer)
  else throw Object.assign(new Error('Unsupported file type. Use CSV or Excel.'), { status: 400 })

  if (!rows.length) throw Object.assign(new Error('File is empty'), { status: 400 })

  const columns = buildColumns(rows)
  return repository.createDatasetTable(file.originalname, columns, rows)
}

const getAllDatasets = () => repository.findAll()
const deleteDataset = (id) => repository.deleteById(id)

module.exports = { processUpload, getAllDatasets, deleteDataset }
