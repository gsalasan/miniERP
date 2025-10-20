import app from './app';
import dotenv from 'dotenv';
dotenv.config();

console.log('>>> DEBUG JWT_SECRET =', process.env.JWT_SECRET);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Identity Service running on port ${PORT}`));
