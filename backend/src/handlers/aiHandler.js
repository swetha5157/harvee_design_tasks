const service = require('../services/aiService')

const askQuestion = async (req, res) => {
  const { question } = req.body
  if (!question?.trim()) {
    return res.status(400).json({ error: 'question is required' })
  }
  const answer = await service.askQuestion(question)
  res.json({ success: true, data: { answer } })
}

const getReports = async (req, res) => {
  const data = await service.getReports()
  res.json({ success: true, data })
}

module.exports = { askQuestion, getReports }