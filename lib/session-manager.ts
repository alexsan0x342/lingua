import { prisma } from "./db";
import { auth } from "./auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Single Session Manager
 * Ensures only one active session per user at any time
 */
export class SessionManager {
  /**
   * Invalidate all existing sessions for a user except the current one
   */
  static async enforcesSingleSession(userId: string, currentSessionId: string) {
    try {
      // Delete all other sessions for this user
      await prisma.session.deleteMany({
        where: {
          userId: userId,
          id: {
            not: currentSessionId
          }
        }
      });

      console.log(`🔒 Single session enforced for user ${userId}`);
      return true;
    } catch (error) {
      console.error("❌ Error enforcing single session:", error);
      return false;
    }
  }

  /**
   * Check if user has multiple active sessions and clean them up
   */
  static async validateSingleSession(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Get current session from better-auth
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user?.id || !session?.session?.id) {
        return null; // No session, continue normally
      }

      const userId = session.user.id;
      const currentSessionId = session.session.id;

      // Check if user has multiple sessions
      const userSessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (userSessions.length > 1) {
        // Keep only the most recent session (current one)
        const sessionsToDelete = userSessions.filter(s => s.id !== currentSessionId);
        
        if (sessionsToDelete.length > 0) {
          await prisma.session.deleteMany({
            where: {
              id: {
                in: sessionsToDelete.map(s => s.id)
              }
            }
          });

          console.log(`🔒 Removed ${sessionsToDelete.length} duplicate sessions for user ${userId}`);
        }
      }

      return null; // Continue with request
    } catch (error) {
      console.error("❌ Error in session validation:", error);
      return null; // Continue on error
    }
  }

  /**
   * Middleware to be called on user login to cleanup old sessions
   */
  static async onUserLogin(userId: string, currentSessionId: string) {
    return this.enforcesSingleSession(userId, currentSessionId);
  }

  /**
   * Get active session count for a user
   */
  static async getActiveSessionCount(userId: string): Promise<number> {
    try {
      const count = await prisma.session.count({
        where: { userId }
      });
      return count;
    } catch (error) {
      console.error("❌ Error counting sessions:", error);
      return 0;
    }
  }

  /**
   * Force logout all sessions for a user
   */
  static async forceLogoutAllSessions(userId: string) {
    try {
      await prisma.session.deleteMany({
        where: { userId }
      });
      
      console.log(`🔒 Force logged out all sessions for user ${userId}`);
      return true;
    } catch (error) {
      console.error("❌ Error force logging out sessions:", error);
      return false;
    }
  }
}