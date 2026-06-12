const router = require('express').Router()
const { asyncHandler } = require('../middleware/asyncHandler')
const handler = require('../handlers/courseHandler')

router.post('/',     asyncHandler(handler.createCourse))
router.get('/',      asyncHandler(handler.getAllCourses))
router.delete('/:id', asyncHandler(handler.deleteCourse))

module.exports = {courseRoute : router};