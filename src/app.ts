import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { requestIdMiddleware } from "./middlewares/requestId";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";
import { AppError } from "./utils/errors";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestIdMiddleware);
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" }, requestId: res.getHeader("X-Request-Id") });
});

app.use("/v1", routes);

app.use((_req, _res, next) => {
  next(new AppError(404, "NOT_FOUND", "Route not found"));
});

app.use(errorHandler);
