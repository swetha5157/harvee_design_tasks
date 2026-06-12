const router = require('express').Router()
const { asyncHandler } = require('../middleware/asyncHandler')
const handler = require('../handlers/queryHandler')

router.post('/',              asyncHandler(handler.runQuery))
router.get('/history/:dataset_id', asyncHandler(handler.getHistory))

module.exports = {queryRoute : router};