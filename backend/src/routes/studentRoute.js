const router = require('express').Router()
const { asyncHandler } = require('../middleware/asyncHandler')
const handler = require('../handlers/studentHandler')

router.post('/',  asyncHandler(handler.registerStudent))
router.get('/',   asyncHandler(handler.getAllStudents))
router.get('/:id', asyncHandler(handler.getStudentById))
router.delete('/:id', asyncHandler(handler.deleteStudent))

module.exports = {studentRoute : router};