import { Router } from "express";
import { getScheme, getSchemes, getEligibleSchemesMatch } from "../controllers/scheme.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router: ReturnType<typeof Router> = Router();

router.get("/match", authenticateToken, getEligibleSchemesMatch);
router.get("/", getSchemes);
router.get("/:schemeId", getScheme);

export default router;