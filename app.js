const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/user.routes');
const indexRouter = require('./routes/index.routes');
const connectToDB = require('./config/db');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
(async () => {
  try {
    await connectToDB();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
})();

// View Engine
app.set('view engine', 'ejs');

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', indexRouter);
app.use('/user', userRouter);

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
