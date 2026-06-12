const service = require('../services/allocationService')

const runAllocation = async (req, res) => {
  const result = await service.runAllocation()
  res.json({ success: true, data: result })
}

const getAllAllocations = async (req, res) => {
  const data = await service.getAllAllocations()
  res.json({ success: true, data })
}

const getStats = async (req, res) => {
  const data = await service.getStats()
  res.json({ success: true, data })
}

const getUnallocated = async (req, res) => {
  const data = await service.getUnallocated()
  res.json({ success: true, data })
}

const getDashboard = async (req, res) => {
  const data = await service.getDashboard()
  res.json({ success: true, data })
}

const resetAllocations = async (req, res) => {
  await service.resetAllocations()
  res.json({ success: true, message: 'Allocations cleared' })
}

module.exports = { runAllocation, getAllAllocations, getStats, getUnallocated, getDashboard, resetAllocations }