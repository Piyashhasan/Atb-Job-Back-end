import "dotenv/config";
import { connectionDB } from "./src/DB/connectionDB.js";
import app from "./src/app.js";

// --- DB connection stablish + App listening ---
connectionDB()
  .then(() => {
    app.listen(process.env.PORT || 8080, () => {
      console.log(`Server is running at PORT - ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Failed DB connection + App listening...", err.message);
  });
