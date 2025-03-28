import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";

import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
const PORT = process.env.PORT ;
// GLOBAL RATE LIMITING
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // limit each ip to 100 request per window 
    message: "Too many requests",
});
// security middle ware
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());
app.use("/api",limiter);

// logging middleware
if(process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// Body parser Middleware
app.use(express.json({ limit: "10kb"}));
app.use(express.urlencoded({ extended: true , limit : "10kb"}));
app.use(cookieParser());
 // GLOBAL error handler
 app.use((err,req,res,next) => {
          console.error(err.stack);
          res.status(err.status || 500 ).json({
              status: "error",
              message: err.message || "Internal server error",
              ...PORT(process.env,NODE_ENV) === "development" && {stack: err.stack},
          });
 });

// CORS configutation
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST","PUT","DELETE","PATCH","HEAD" , "OPTIONS"],
    allowedHeaders :[
        "Content-type",
        "Authorization",
        "X-Requested-With",
        "device-remember-token",
        "Acess-control-Allow-Origin",
        "Origin",
        "Accept",
    ],
}));
//API ROUTES
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

