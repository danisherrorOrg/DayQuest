import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { saveDay, listDays, getDay } from "../controllers/days.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", listDays);
router.get("/:date", getDay);
router.put("/:date", saveDay);

export default router;
