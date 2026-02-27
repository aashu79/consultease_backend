import { Router } from "express";
import tenantRoutes from "./tenant.routes";
import authRoutes from "./auth.routes";
import userRoutes, { invitationRouter } from "./user.routes";
import rbacRoutes from "./rbac.routes";
import leadRoutes from "./lead.routes";
import studentRoutes, { caseRouter } from "./student.routes";
import studentPortalRoutes from "./studentPortal.routes";
import documentRoutes from "./document.routes";
import storageRoutes from "./storage.routes";
import auditRoutes from "./audit.routes";
import dashboardRoutes from "./dashboard.routes";
import marketingRoutes from "./marketing.routes";
import { tenantResolver } from "../middlewares/tenantResolver";

const router = Router();

router.use("/consultancies", tenantRoutes);
router.use("/tenants", tenantRoutes);
router.use("/auth", authRoutes);
router.use("/invitations", invitationRouter);

router.use("/users", tenantResolver, userRoutes);
router.use("/roles", tenantResolver, rbacRoutes);
router.use("/leads", tenantResolver, leadRoutes);
router.use("/", tenantResolver, studentPortalRoutes);
router.use("/students", tenantResolver, studentRoutes);
router.use("/cases", tenantResolver, caseRouter);
router.use("/storage", tenantResolver, storageRoutes);
router.use("/audit", tenantResolver, auditRoutes);
router.use("/marketing", tenantResolver, marketingRoutes);
router.use("/", tenantResolver, documentRoutes);
router.use("/", tenantResolver, dashboardRoutes);

export default router;
