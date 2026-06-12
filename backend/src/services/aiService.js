const { getModel } = require('../config/gemini')
const repository = require('../repositories/allocationRepository')

const formatCourseAllocations = (courses) =>
  courses.map(c =>
    `- ${c.course}: ${c.allocated} allocated, ${c.available_seats} seats available (${c.total_seats} total)`
  ).join('\n')

const formatCategoryStats = (stats) => {
  if (!stats.length) return 'No category-wise allocations yet.'
  return stats.map(s => `- ${s.course} (${s.category}): ${s.count}`).join('\n')
}

const formatNotFirstPreference = (students) => {
  if (!students.length) return 'All allocated students received their first preference.'
  return students.map(s =>
    `- ${s.name} (${s.student_id}): wanted ${s.first_preference}, got ${s.allocated_course}`
  ).join('\n')
}

const formatRejectionRates = (rates) => {
  if (!rates.length) return 'No rejection data available yet.'
  return rates.map(r =>
    `- ${r.course}: ${r.rejection_rate_pct}% rejection (${r.rejected}/${r.total_applicants} applicants not allocated)`
  ).join('\n')
}

const buildStructuredAnswer = (question, analytics) => {
  const q = question.toLowerCase()

  if (q.includes('each course') || q.includes('how many') && q.includes('allocated')) {
    return `Students allocated per course:\n${formatCourseAllocations(analytics.courseSummary)}`
  }

  if (q.includes('first preference') || q.includes('not receive') || q.includes('did not get')) {
    const count = analytics.studentsNotFirstPreference.length
    return `${count} student(s) did not receive their first preference:\n${formatNotFirstPreference(analytics.studentsNotFirstPreference)}`
  }

  if (q.includes('rejection') || q.includes('highest reject')) {
    const highest = analytics.rejectionRates[0]
    let answer = `Course rejection rates (highest first):\n${formatRejectionRates(analytics.rejectionRates)}`
    if (highest) {
      answer += `\n\nHighest rejection rate: ${highest.course} at ${highest.rejection_rate_pct}%`
    }
    return answer
  }

  if (q.includes('category') || q.includes('reservation') || q.includes('obc') || q.includes('sc') || q.includes('st')) {
    return `Category-wise allocation summary:\n${formatCategoryStats(analytics.categoryStats)}`
  }

  if (q.includes('unallocated') || q.includes('not allocated')) {
    const list = analytics.unallocatedStudents
    if (!list.length) return 'All students have been allocated to a course.'
    return `${list.length} unallocated student(s):\n${list.map(s => `- ${s.name} (${s.student_id}), marks: ${s.marks}, category: ${s.category}`).join('\n')}`
  }

  if (q.includes('summary') || q.includes('overview') || q.includes('status')) {
    const t = analytics.totals
    return `Allocation Summary:
- Total students: ${t.total_students}
- Allocated: ${t.total_allocated}
- Unallocated: ${t.total_students - t.total_allocated}
- Total courses: ${t.total_courses}

Per course:
${formatCourseAllocations(analytics.courseSummary)}

Category breakdown:
${formatCategoryStats(analytics.categoryStats)}`
  }

  return null
}

const askQuestion = async (question) => {
  const analytics = await repository.getDashboardStats()
  const structured = buildStructuredAnswer(question, analytics)

  const gemini = getModel()
  if (!gemini) {
    return structured || 'AI is not configured. Set GEMINI_API_KEY in .env. Here is the latest data:\n' +
      formatCourseAllocations(analytics.courseSummary)
  }

  const prompt = `
You are an AI assistant for a university course allocation system.
Answer using ONLY the data below. Be concise and structured.

Totals: ${JSON.stringify(analytics.totals)}

Course summary:
${JSON.stringify(analytics.courseSummary, null, 2)}

Category-wise allocations:
${JSON.stringify(analytics.categoryStats, null, 2)}

Students who did NOT get first preference:
${JSON.stringify(analytics.studentsNotFirstPreference, null, 2)}

Course rejection rates:
${JSON.stringify(analytics.rejectionRates, null, 2)}

Unallocated students:
${JSON.stringify(analytics.unallocatedStudents, null, 2)}

Question: ${question}
  `

  try {
    const result = await gemini.generateContent(prompt)
    return result.response.text()
  } catch (err) {
    console.error('[AI] Gemini failed, using structured fallback:', err.message)
    if (structured) return structured

    const msg = err?.message || 'AI service error'
    if (/429|quota|rate.?limit|exceeded/i.test(msg)) {
      throw Object.assign(
        new Error('AI quota exceeded. Please wait a minute or upgrade your Gemini API plan.'),
        { status: 429, retryAfter: 60 }
      )
    }
    if (/404|not found|not supported/i.test(msg)) {
      throw Object.assign(
        new Error('Configured Gemini model is not available. Set GEMINI_MODEL in .env to a supported model.'),
        { status: 503 }
      )
    }
    if (/401|403|api.?key|permission/i.test(msg)) {
      throw Object.assign(new Error('Invalid or unauthorized GEMINI_API_KEY.'), { status: 401 })
    }
    throw Object.assign(
      new Error('AI service unavailable and no structured answer matched your question'),
      { status: 502 }
    )
  }
}

const getReports = () => repository.getDashboardStats()

module.exports = { askQuestion, getReports }
