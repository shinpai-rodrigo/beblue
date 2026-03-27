import { prisma } from '@/lib/db';

export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  oldData?: any,
  newData?: any,
  ipAddress?: string,
  critical: boolean = false
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldData: oldData || null,
        newData: newData || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error(
      `Erro ao registrar log de auditoria [action=${action}, entity=${entity}, entityId=${entityId}, userId=${userId}]:`,
      error
    );
    if (critical) {
      throw error;
    }
  }
}
