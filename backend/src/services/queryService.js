const { getModel } = require('../config/gemini')
const repository = require('../repositories/queryRepository')
const pool = require('../config/db')
const { validateSelectQuery } = require('../utils/sqlValidator')

const parseSchema = (schemaInfo) => {
  if (!schemaInfo) return []
  if (typeof schemaInfo === 'string') return JSON.parse(schemaInfo)
  return schemaInfo
}

const cleanGeneratedSql = (text) =>
  text.trim()
    .replace(/^```sql\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

// Translate GoogleGenerativeAI errors into clean HTTP errors with a Retry-After hint.
const normalizeGeminiError = (err) => {
  const msg = err?.message || 'AI service error'
  const isQuota = /429|quota|rate.?limit|exceeded/i.test(msg)
  const isMissing = /404|not found|not supported/i.test(msg)
  const isAuth = /401|403|api.?key|permission/i.test(msg)

  if (isQuota) {
    const e = new Error('AI quota exceeded. Please wait a minute or upgrade your Gemini API plan.')
    e.status = 429
    e.retryAfter = 60
    return e
  }
  if (isMissing) {
    return Object.assign(
      new Error('Configured Gemini model is not available. Set GEMINI_MODEL in .env to a supported model (e.g. gemini-2.0-flash).'),
      { status: 503 }
    )
  }
  if (isAuth) {
    return Object.assign(new Error('Invalid or unauthorized GEMINI_API_KEY.'), { status: 401 })
  }
  return Object.assign(new Error(msg), { status: 502 })
}

const runQuery = async (dataset_id, question) => {
  const dataset = await repository.findDatasetById(dataset_id)
  if (!dataset) throw Object.assign(new Error('Dataset not found'), { status: 404 })

  const schema = parseSchema(dataset.schema_info)
  if (!schema.length) {
    throw Object.assign(new Error('Dataset schema not found'), { status: 400 })
  }

  const gemini = getModel()
  if (!gemini) {
    throw Object.assign(new Error('AI service not configured. Set GEMINI_API_KEY in .env'), { status: 503 })
  }

  const prompt = `
You are a PostgreSQL expert. Return ONLY a raw SQL SELECT query, nothing else.
No markdown, no backticks, no explanation.

Table: "${dataset.table_name}"
Columns:
${schema.map(c => `  "${c.sanitized}" (${c.type})`).join('\n')}

Rules:
- SELECT only, no INSERT/UPDATE/DELETE/DROP
- Use exact column names with double quotes
- Query MUST reference only table "${dataset.table_name}"
- Default LIMIT 100 unless user specifies otherwise
- Handle NULLs properly

Question: "${question}"
  `

  let generatedSQL = ''
  try {
    const result = await gemini.generateContent(prompt)
    generatedSQL = cleanGeneratedSql(result.response.text())
    generatedSQL = validateSelectQuery(generatedSQL, dataset.table_name)

    const queryResult = await pool.query(generatedSQL)
    await repository.saveHistory(dataset_id, question, generatedSQL, 'success')

    return {
      sql: generatedSQL,
      rows: queryResult.rows,
      rowCount: queryResult.rowCount,
      columns: queryResult.fields?.map(f => f.name) || Object.keys(queryResult.rows[0] || {})
    }
  } catch (err) {
    await repository.saveHistory(
      dataset_id,
      question,
      generatedSQL || err.message,
      'error'
    ).catch(() => {})
    if (err.status) throw err
    throw normalizeGeminiError(err)
  }
}

const getHistory = (dataset_id) => repository.findHistory(dataset_id)

module.exports = { runQuery, getHistory }
