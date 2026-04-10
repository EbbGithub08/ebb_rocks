import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Future API mounts (implement in separate modules when ready):
// import { commentsRouter } from "./comments.js";
// import { authRouter } from "./auth.js";
// import { adminRouter } from "./admin.js";
// router.use("/comments", commentsRouter);
// router.use("/auth", authRouter);
// router.use("/admin", adminRouter);

export { router as apiRouter };
