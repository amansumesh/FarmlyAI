import { Router } from "express";
import { getScheme, getSchemes, getEligibleSchemesMatch } from "../controllers/scheme.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router: ReturnType<typeof Router> = Router();

router.get("/match", authenticateToken, getEligibleSchemesMatch);
router.get("/", getSchemes);
router.get("/:schemeId", getScheme);

export default router;
