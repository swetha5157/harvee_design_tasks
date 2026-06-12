const router = require('express').Router()
const multer = require('multer')
const { asyncHandler } = require('../middleware/asyncHandler')
const handler = require('../handlers/uploadFilesHandler')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV and Excel files allowed'))
    }
  }
})

router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return next(Object.assign(err, { status: 400 }))
    next()
  })
}, asyncHandler(handler.uploadFile))
router.get('/datasets',   asyncHandler(handler.getAllDatasets))
router.delete('/:id',     asyncHandler(handler.deleteDataset))

module.exports = {uploadFilesRoute : router}; 
