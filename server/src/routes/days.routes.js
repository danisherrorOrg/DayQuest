import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { saveDay, listDays, getDay, deleteDay } from "../controllers/days.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", listDays);
router.get("/:date", getDay);
router.put("/:date", saveDay);
router.delete("/:date", deleteDay);

export default router;
