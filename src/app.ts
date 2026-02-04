import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Routes
import transferRoutes from "./routes/transfer.route";

const app: Application = express();

// Middleware
// Rate-limiting middleware to limit repeated requests to public APIs and/or endpoints
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10, // Limit each IP to 10 requests per `window` (here, per 5 minutes).
  standardHeaders: "draft-8", // draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Rate limit by /56 IPv6 subnet
  message:
    "Too many requests from this IP, please try again in another 5 minutes!",
});

app.use(limiter);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow only accepted origin
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route to verify server is running
app.get("/", (_req, res) => {
  res.status(200).send("Sycamore Backend Assessment API is running.");
});

// Transfer routes
app.use("/transfer", transferRoutes);

// Unknown routes Handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  const error = new Error(
    `Cannot find '${req.originalUrl}' route on this server!`,
  );
  error.name = "NotFound";
  next(error);
});

// Global Error Handling Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  let errorName = err.name;
  let errorMessage = err.message;
  let statusCode;

  if (
    err.name === "ValidationError" ||
    err.name === "InsufficientFundsError" ||
    err.name === "BadRequest"
  )
    statusCode = 400;
  else if (err.name === "Unauthorized") statusCode = 401;
  else if (err.name === "Forbidden") statusCode = 403;
  else if (err.name === "NotFound") statusCode = 404;
  else {
    statusCode = 500;
    errorName = "InternalServerError";
    errorMessage = "Something went wrong. Please try again after a while.";
    console.error(`Error: , ${err}`);
  }

  res.status(statusCode).json({
    status: "error",
    statusCode,
    name: errorName,
    message: errorMessage,
  });
});

export default app;
