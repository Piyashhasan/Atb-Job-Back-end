import mongoose from "mongoose";
import { dbName } from "../constant.js";

export const connectionDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xgqus.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=Cluster0`
    );
    console.log(
      "Data base connection successfully ...",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log("Error from DB connectionDB function ", error);
    process.exit(1);
  }
};
