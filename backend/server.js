require('dotenv').config({ path: __dirname + '/.env' });

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});