import { Router } from "express";
import { authRouter } from "./auth.js";
import { dbRouter } from "./db.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});
router.use("/db", dbRouter);

// Future API mounts (implement in separate modules when ready):
// import { commentsRouter } from "./comments.js";
// import { authRouter } from "./auth.js";
// import { adminRouter } from "./admin.js";
// router.use("/comments", commentsRouter);
router.use("/auth", authRouter);
// router.use("/admin", adminRouter);

export { router as apiRouter };
