import { Request, Response } from "express";
import { getAllSchemes, getSchemeById, SchemeService } from "../services/scheme.service.js";
import { User } from "../models/user.model.js";
import { AuthRequest } from "../types/auth.types.js";

export async function getSchemes(_req: Request, res: Response) {
  try {
    const schemes = await getAllSchemes();
    res.json({ success: true, schemes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch schemes" });
  }
}

export async function getScheme(req: Request, res: Response) {
  try {
    const { schemeId } = req.params;
    const scheme = await getSchemeById(schemeId);

    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }

    return res.json({ success: true, scheme });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch scheme" });
  }
}

export async function getEligibleSchemesMatch(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || !authReq.user.userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { language } = req.query;
    const user = await User.findById(authReq.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const result = await SchemeService.getEligibleSchemes(user, (language as string) || 'en');
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error in getEligibleSchemesMatch:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch eligible schemes" });
  }
}
