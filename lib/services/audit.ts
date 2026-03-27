import { prisma } from '@/lib/db';

export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  oldData?: any,
  newData?: any,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
  }
}
