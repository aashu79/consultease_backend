import { Permission, Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      tenant?: {
        consultancyId: string;
        slug: string;
      };
      user?: {
        userId: string;
        consultancyId: string;
        roles: Pick<Role, "id" | "name" | "key">[];
        permissions: string[];
        emailVerified: boolean;
        phoneVerified: boolean;
        sessionId: string;
      };
      studentPortal?: {
        studentId: string;
      };
    }
  }
}

export {};
