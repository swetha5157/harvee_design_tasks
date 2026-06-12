const router = require('express').Router()
const { asyncHandler } = require('../middleware/asyncHandler')
const handler = require('../handlers/allocationHandler')

router.post('/run',      asyncHandler(handler.runAllocation))
router.get('/',          asyncHandler(handler.getAllAllocations))
router.get('/stats',     asyncHandler(handler.getStats))
router.get('/dashboard', asyncHandler(handler.getDashboard))
router.get('/unallocated', asyncHandler(handler.getUnallocated))
router.delete('/reset',  asyncHandler(handler.resetAllocations))

module.exports = {allocationRoute : router};