const service = require('../services/uploadFilesService')

const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })
  const result = await service.processUpload(req.file)
  res.status(201).json({ success: true, data: result })
}

const getAllDatasets = async (req, res) => {
  const datasets = await service.getAllDatasets()
  res.json({ success: true, data: datasets })
}

const deleteDataset = async (req, res) => {
  await service.deleteDataset(req.params.id)
  res.json({ success: true })
}

module.exports = { uploadFile, getAllDatasets, deleteDataset }