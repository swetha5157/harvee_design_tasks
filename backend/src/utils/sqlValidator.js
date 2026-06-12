const BLOCKED_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
  'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'COPY', 'CALL', 'DO', 'SET',
  'VACUUM', 'ANALYZE', 'REINDEX', 'CLUSTER', 'COMMENT', 'LOCK',
  'NOTIFY', 'LISTEN', 'UNLISTEN', 'LOAD', 'SECURITY', 'OWNER'
]

const validateSelectQuery = (sql, allowedTable) => {
  if (!sql || typeof sql !== 'string') {
    throw Object.assign(new Error('Invalid SQL query'), { status: 400 })
  }

  const trimmed = sql.trim().replace(/;\s*$/, '')

  if (trimmed.includes(';')) {
    throw Object.assign(new Error('Multiple SQL statements are not allowed'), { status: 400 })
  }

  const normalized = trimmed.replace(/\s+/g, ' ').toUpperCase()

  if (!normalized.startsWith('SELECT')) {
    throw Object.assign(new Error('Only SELECT queries are allowed'), { status: 400 })
  }

  for (const keyword of BLOCKED_KEYWORDS) {
    const pattern = new RegExp(`\\b${keyword}\\b`)
    if (pattern.test(normalized)) {
      throw Object.assign(new Error(`Forbidden SQL keyword: ${keyword}`), { status: 400 })
    }
  }

  const tablePattern = new RegExp(`"${allowedTable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i')
  if (!tablePattern.test(trimmed)) {
    throw Object.assign(
      new Error(`Query must reference table "${allowedTable}" only`),
      { status: 400 }
    )
  }

  return trimmed
}

module.exports = { validateSelectQuery }
