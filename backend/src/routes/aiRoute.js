const router = require('express').Router()
const { asyncHandler } = require('../middleware/asyncHandler')
const handler = require('../handlers/aiHandler')



router.post('/ask', asyncHandler(handler.askQuestion))
router.get('/reports', asyncHandler(handler.getReports))

module.exports = {aiRoute : router};