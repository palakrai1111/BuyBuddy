import mongoose from "mongoose";
const configOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
const connectToDB = async () => {
   const connectionUrl = process.env.MONGODB_URI;
   if (!connectionUrl) {
    console.error("❌ MONGODB_URI is not defined in your environment variables.");
    process.exit(1);
  }
  mongoose
    .connect(connectionUrl, configOptions)
    .then(() => console.log("Ecommerce database connected successfully!"))
    .catch((err) =>
      console.log(`Getting Error from DB connection ${err.message}`)
    );
};
export default connectToDB;