import "dotenv/config";
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import redisClient from './services/redis.js';
// import dbClient from './services/db.js';

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(routes);

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);
});
