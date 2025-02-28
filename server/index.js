import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT ;
// it should be always at bottom 
// 404 handler
app.use((req,res)=> {
    res.status(404).json({
        status:"error",
        message: "Route not found",
    });
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} , in ${process.env.NODE_ENV} mode`);
});

