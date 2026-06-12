const service = require('../services/queryService')

const runQuery = async (req, res) => {
  const { dataset_id, question } = req.body
  if (!dataset_id || !question?.trim()) {
    return res.status(400).json({ error: 'dataset_id and question are required' })
  }
  const result = await service.runQuery(dataset_id, question)
  res.json({ success: true, data: result })
}

const getHistory = async (req, res) => {
  const history = await service.getHistory(req.params.dataset_id)
  res.json({ success: true, data: history })
}

module.exports = { runQuery, getHistory }