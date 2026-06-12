const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { studentRoute } = require('./routes/studentRoute');
const { courseRoute } = require('./routes/courseRoute');
const { allocationRoute } = require('./routes/allocationRoute');
const { aiRoute } = require('./routes/aiRoute');
const { uploadFilesRoute } = require('./routes/uploadFilesRoute');
const { queryRoute } = require('./routes/queryRoute');


console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_USER =", process.env.DB_USER);
console.log("DATABASE_URL =", process.env.DATABASE_URL);
console.log("DB_PASSWORD =", process.env.DB_PASSWORD);
console.log("typeof =", typeof process.env.DB_PASSWORD);
const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api/students', studentRoute);
app.use('/api/courses', courseRoute);
app.use('/api/allocations', allocationRoute);
app.use('/api/ai', aiRoute);
app.use('/api/upload', uploadFilesRoute);
app.use('/api/query', queryRoute);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
});