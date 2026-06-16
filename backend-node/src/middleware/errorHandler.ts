import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error("[ERROR]", err.message, err.stack);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: "Not Found", message: `Route ${req.method} ${req.path} not found` });
}
