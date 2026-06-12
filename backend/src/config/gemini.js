const { GoogleGenerativeAI } = require('@google/generative-ai')

let model = null

// Default to a currently supported model. gemini-1.5-flash was retired from v1beta.
// Override via GEMINI_MODEL in .env if you have access to a different model.
const DEFAULT_MODEL = 'gemini-2.5-flash'

const getModel = () => {
  if (model) return model
  if (!process.env.GEMINI_API_KEY) return null
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL
  })
  return model
}

module.exports = { getModel, DEFAULT_MODEL }
