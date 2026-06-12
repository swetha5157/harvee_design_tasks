const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`)
  const status = err.status || 500
  if (err.retryAfter) {
    res.setHeader('Retry-After', String(err.retryAfter))
  }
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(err.retryAfter && { retryAfter: err.retryAfter }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

module.exports = { errorHandler }