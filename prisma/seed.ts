import { PrismaClient, Role, ClientType, CommissionBasis, ReimbursementCategory, CampaignStatus, InvoiceStatus, ReimbursementStatus, InfluencerPaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ==================== USERS ====================
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const hashedUser = await bcrypt.hash('user123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@beblue.com' },
    update: {},
    create: {
      email: 'admin@beblue.com',
      name: 'Administrador',
      password: hashedPassword,
      role: Role.ADMIN,
      active: true,
    },
  });

  const financeUser = await prisma.user.upsert({
    where: { email: 'financeiro@beblue.com' },
    update: {},
    create: {
      email: 'financeiro@beblue.com',
      name: 'Maria Financeiro',
      password: hashedUser,
      role: Role.FINANCEIRO,
      active: true,
    },
  });

  const comercialUser = await prisma.user.upsert({
    where: { email: 'comercial@beblue.com' },
    update: {},
    create: {
      email: 'comercial@beblue.com',
      name: 'João Comercial',
      password: hashedUser,
      role: Role.COMERCIAL,
      active: true,
    },
  });

  const operacaoUser = await prisma.user.upsert({
    where: { email: 'operacao@beblue.com' },
    update: {},
    create: {
      email: 'operacao@beblue.com',
      name: 'Ana Operação',
      password: hashedUser,
      role: Role.OPERACAO,
      active: true,
    },
  });

  const gestorUser = await prisma.user.upsert({
    where: { email: 'gestor@beblue.com' },
    update: {},
    create: {
      email: 'gestor@beblue.com',
      name: 'Carlos Gestor',
      password: hashedUser,
      role: Role.GESTOR,
      active: true,
    },
  });

  console.log('Users created.');

  // ==================== EMPLOYEES ====================
  const executive = await prisma.employee.create({
    data: {
      name: 'João Comercial',
      email: 'joao.comercial@beblue.com',
      phone: '(11) 99999-0001',
      position: 'Executivo de Contas',
      department: 'Comercial',
      role: Role.COMERCIAL,
      active: true,
      userId: comercialUser.id,
    },
  });

  const operationMgr = await prisma.employee.create({
    data: {
      name: 'Ana Operação',
      email: 'ana.operacao@beblue.com',
      phone: '(11) 99999-0002',
      position: 'Gerente de Operações',
      department: 'Operações',
      role: Role.OPERACAO,
      active: true,
      userId: operacaoUser.id,
    },
  });

  const financeEmployee = await prisma.employee.create({
    data: {
      name: 'Maria Financeiro',
      email: 'maria.financeiro@beblue.com',
      phone: '(11) 99999-0003',
      position: 'Analista Financeira',
      department: 'Financeiro',
      role: Role.FINANCEIRO,
      active: true,
      userId: financeUser.id,
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      name: 'Administrador',
      email: 'admin.employee@beblue.com',
      phone: '(11) 99999-0004',
      position: 'Administrador',
      department: 'Diretoria',
      role: Role.ADMIN,
      active: true,
      userId: adminUser.id,
    },
  });

  const gestorEmployee = await prisma.employee.create({
    data: {
      name: 'Carlos Gestor',
      email: 'carlos.gestor@beblue.com',
      phone: '(11) 99999-0005',
      position: 'Gestor de Projetos',
      department: 'Gestão',
      role: Role.GESTOR,
      active: true,
      userId: gestorUser.id,
    },
  });

  console.log('Employees created.');

  // ==================== CLIENTS ====================
  const client1 = await prisma.client.create({
    data: {
      name: 'Tech Solutions Ltda',
      tradeName: 'TechSol',
      document: '12.345.678/0001-90',
      email: 'contato@techsol.com.br',
      phone: '(11) 3000-1000',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      notes: 'Cliente premium',
      active: true,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Moda Brasil S.A.',
      tradeName: 'ModaBR',
      document: '98.765.432/0001-10',
      email: 'contato@modabr.com.br',
      phone: '(21) 3000-2000',
      address: 'Rua da Moda, 500',
      city: 'Rio de Janeiro',
      state: 'RJ',
      active: true,
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Alimentos Sabor Ltda',
      tradeName: 'Sabor',
      document: '11.222.333/0001-44',
      email: 'contato@sabor.com.br',
      phone: '(31) 3000-3000',
      address: 'Rua dos Sabores, 200',
      city: 'Belo Horizonte',
      state: 'MG',
      active: true,
    },
  });

  console.log('Clients created.');

  // ==================== COST CENTERS ====================
  const costCenter1 = await prisma.costCenter.create({
    data: {
      name: 'Marketing Digital',
      code: 'MKT-001',
      description: 'Centro de custo para campanhas de marketing digital',
      active: true,
    },
  });

  const costCenter2 = await prisma.costCenter.create({
    data: {
      name: 'Eventos e Ativações',
      code: 'EVT-001',
      description: 'Centro de custo para eventos e ativações presenciais',
      active: true,
    },
  });

  console.log('Cost centers created.');

  // ==================== REIMBURSEMENT RULES ====================
  await prisma.reimbursementRule.createMany({
    data: [
      {
        category: ReimbursementCategory.ALIMENTACAO,
        maxValuePerDay: 20.0,
        description: 'Limite diário para alimentação',
        active: true,
      },
      {
        category: ReimbursementCategory.TRANSPORTE,
        maxValuePerDay: 50.0,
        description: 'Limite diário para transporte',
        active: true,
      },
      {
        category: ReimbursementCategory.HOSPEDAGEM,
        maxValuePerDay: 200.0,
        description: 'Limite diário para hospedagem',
        active: true,
      },
      {
        category: ReimbursementCategory.PEDAGIO,
        maxValuePerDay: 30.0,
        description: 'Limite diário para pedágios',
        active: true,
      },
      {
        category: ReimbursementCategory.QUILOMETRAGEM,
        maxValuePerDay: 1.50,
        description: 'Valor por km rodado',
        active: true,
      },
      {
        category: ReimbursementCategory.OUTROS,
        maxValuePerDay: 100.0,
        description: 'Limite diário para outros gastos',
        active: true,
      },
    ],
  });

  console.log('Reimbursement rules created.');

  // ==================== COMMISSION RULES ====================
  const ruleExecNovo = await prisma.commissionRule.create({
    data: {
      role: Role.COMERCIAL,
      clientType: ClientType.NOVO,
      basis: CommissionBasis.VALOR_VENDIDO,
      percentage: 8.0,
      active: true,
      description: 'Executivo - Cliente Novo - 8% sobre valor vendido',
    },
  });

  const ruleExecCasa = await prisma.commissionRule.create({
    data: {
      role: Role.COMERCIAL,
      clientType: ClientType.CASA,
      basis: CommissionBasis.VALOR_VENDIDO,
      percentage: 5.0,
      active: true,
      description: 'Executivo - Cliente Casa - 5% sobre valor vendido',
    },
  });

  const ruleOpNovo = await prisma.commissionRule.create({
    data: {
      role: Role.OPERACAO,
      clientType: ClientType.NOVO,
      basis: CommissionBasis.MARGEM,
      percentage: 4.0,
      active: true,
      description: 'Operação - Cliente Novo - 4% sobre margem',
    },
  });

  const ruleOpCasa = await prisma.commissionRule.create({
    data: {
      role: Role.OPERACAO,
      clientType: ClientType.CASA,
      basis: CommissionBasis.MARGEM,
      percentage: 3.0,
      active: true,
      description: 'Operação - Cliente Casa - 3% sobre margem',
    },
  });

  console.log('Commission rules created.');

  // ==================== CAMPAIGNS ====================
  const campaign1 = await prisma.campaign.create({
    data: {
      name: 'Campanha Verão TechSol',
      description: 'Campanha de marketing digital para o verão 2025',
      clientId: client1.id,
      clientType: ClientType.NOVO,
      executiveId: executive.id,
      operationId: operationMgr.id,
      costCenterId: costCenter1.id,
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-03-15'),
      soldValue: 50000.0,
      status: CampaignStatus.ATIVA,
      notes: 'Campanha com foco em redes sociais',
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      name: 'Evento ModaBR Fashion Week',
      description: 'Cobertura e ativação no Fashion Week',
      clientId: client2.id,
      clientType: ClientType.CASA,
      executiveId: executive.id,
      operationId: operationMgr.id,
      costCenterId: costCenter2.id,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-04-30'),
      soldValue: 80000.0,
      status: CampaignStatus.ATIVA,
      notes: 'Evento presencial + cobertura digital',
    },
  });

  console.log('Campaigns created.');

  // ==================== CAMPAIGN INFLUENCERS ====================
  const influencer1 = await prisma.campaignInfluencer.create({
    data: {
      campaignId: campaign1.id,
      name: 'Lucas Silva',
      socialHandle: '@lucassilvatech',
      negotiatedValue: 8000.0,
      negotiationDate: new Date('2025-01-10'),
      paymentDeadline: new Date('2025-02-10'),
      dueDate: new Date('2025-02-10'),
      paidValue: 8000.0,
      openValue: 0,
      status: InfluencerPaymentStatus.PAGO,
    },
  });

  const influencer2 = await prisma.campaignInfluencer.create({
    data: {
      campaignId: campaign1.id,
      name: 'Fernanda Costa',
      socialHandle: '@fecosta',
      negotiatedValue: 12000.0,
      negotiationDate: new Date('2025-01-12'),
      paymentDeadline: new Date('2025-02-28'),
      dueDate: new Date('2025-02-28'),
      paidValue: 6000.0,
      openValue: 6000.0,
      status: InfluencerPaymentStatus.PARCIAL,
    },
  });

  const influencer3 = await prisma.campaignInfluencer.create({
    data: {
      campaignId: campaign2.id,
      name: 'Mariana Oliveira',
      socialHandle: '@marioliv',
      negotiatedValue: 15000.0,
      negotiationDate: new Date('2025-01-25'),
      paymentDeadline: new Date('2025-03-15'),
      dueDate: new Date('2025-03-15'),
      paidValue: 0,
      openValue: 15000.0,
      status: InfluencerPaymentStatus.PENDENTE,
    },
  });

  const influencer4 = await prisma.campaignInfluencer.create({
    data: {
      campaignId: campaign2.id,
      name: 'Pedro Santos',
      socialHandle: '@pedrosantos',
      negotiatedValue: 20000.0,
      negotiationDate: new Date('2025-01-28'),
      paymentDeadline: new Date('2025-03-30'),
      dueDate: new Date('2025-03-30'),
      paidValue: 20000.0,
      openValue: 0,
      status: InfluencerPaymentStatus.PAGO,
    },
  });

  console.log('Influencers created.');

  // ==================== INFLUENCER PAYMENTS ====================
  await prisma.influencerPayment.createMany({
    data: [
      {
        campaignInfluencerId: influencer1.id,
        value: 8000.0,
        paymentDate: new Date('2025-02-05'),
        method: 'PIX',
        notes: 'Pagamento integral',
      },
      {
        campaignInfluencerId: influencer2.id,
        value: 6000.0,
        paymentDate: new Date('2025-02-15'),
        method: 'Transferência',
        notes: 'Primeira parcela',
      },
      {
        campaignInfluencerId: influencer4.id,
        value: 20000.0,
        paymentDate: new Date('2025-03-01'),
        method: 'PIX',
        notes: 'Pagamento integral',
      },
    ],
  });

  console.log('Influencer payments created.');

  // ==================== RECEIVABLES ====================
  await prisma.receivable.createMany({
    data: [
      {
        campaignId: campaign1.id,
        clientId: client1.id,
        invoiceNumber: 'NF-2025-001',
        issueDate: new Date('2025-01-20'),
        value: 25000.0,
        dueDate: new Date('2025-02-20'),
        installment: 1,
        totalInstallments: 2,
        status: InvoiceStatus.PAGA,
        receivedDate: new Date('2025-02-18'),
        receivedValue: 25000.0,
        paymentMethod: 'Boleto',
      },
      {
        campaignId: campaign1.id,
        clientId: client1.id,
        invoiceNumber: 'NF-2025-002',
        issueDate: new Date('2025-02-20'),
        value: 25000.0,
        dueDate: new Date('2025-03-20'),
        installment: 2,
        totalInstallments: 2,
        status: InvoiceStatus.EMITIDA,
      },
      {
        campaignId: campaign2.id,
        clientId: client2.id,
        invoiceNumber: 'NF-2025-003',
        issueDate: new Date('2025-02-05'),
        value: 40000.0,
        dueDate: new Date('2025-03-05'),
        installment: 1,
        totalInstallments: 2,
        status: InvoiceStatus.ENVIADA,
      },
      {
        campaignId: campaign2.id,
        clientId: client2.id,
        invoiceNumber: 'NF-2025-004',
        issueDate: new Date('2025-03-05'),
        value: 40000.0,
        dueDate: new Date('2025-04-05'),
        installment: 2,
        totalInstallments: 2,
        status: InvoiceStatus.EMITIDA,
      },
    ],
  });

  console.log('Receivables created.');

  // ==================== REIMBURSEMENTS ====================
  await prisma.reimbursement.createMany({
    data: [
      {
        employeeId: executive.id,
        campaignId: campaign1.id,
        costCenterId: costCenter1.id,
        category: ReimbursementCategory.TRANSPORTE,
        requestedValue: 150.0,
        approvedValue: 150.0,
        paidValue: 150.0,
        date: new Date('2025-01-20'),
        description: 'Uber para reunião com cliente TechSol',
        status: ReimbursementStatus.PAGO,
      },
      {
        employeeId: executive.id,
        campaignId: campaign1.id,
        costCenterId: costCenter1.id,
        category: ReimbursementCategory.ALIMENTACAO,
        requestedValue: 85.0,
        approvedValue: 60.0,
        paidValue: 0,
        date: new Date('2025-01-20'),
        description: 'Almoço com cliente TechSol',
        status: ReimbursementStatus.APROVADO_PARCIAL,
        reviewNotes: 'Valor acima do limite diário, aprovado parcialmente',
      },
      {
        employeeId: operationMgr.id,
        campaignId: campaign2.id,
        costCenterId: costCenter2.id,
        category: ReimbursementCategory.HOSPEDAGEM,
        requestedValue: 450.0,
        date: new Date('2025-02-10'),
        description: 'Hotel para evento Fashion Week - 2 diárias',
        status: ReimbursementStatus.EM_ANALISE,
      },
      {
        employeeId: operationMgr.id,
        campaignId: campaign2.id,
        costCenterId: costCenter2.id,
        category: ReimbursementCategory.QUILOMETRAGEM,
        requestedValue: 120.0,
        approvedValue: 120.0,
        paidValue: 120.0,
        date: new Date('2025-02-08'),
        description: '80km para local do evento',
        status: ReimbursementStatus.PAGO,
      },
    ],
  });

  console.log('Reimbursements created.');

  // ==================== COMMISSIONS ====================
  // Campaign 1 - Novo client
  await prisma.commission.create({
    data: {
      campaignId: campaign1.id,
      employeeId: executive.id,
      ruleId: ruleExecNovo.id,
      basis: CommissionBasis.VALOR_VENDIDO,
      baseValue: 50000.0,
      percentage: 8.0,
      calculatedValue: 4000.0,
      status: CommissionStatus.CALCULADA,
    },
  });

  // Margin for campaign 1: 50000 - 20000 (influencers) - 210 (approved reimbursements) = 29790
  await prisma.commission.create({
    data: {
      campaignId: campaign1.id,
      employeeId: operationMgr.id,
      ruleId: ruleOpNovo.id,
      basis: CommissionBasis.MARGEM,
      baseValue: 29790.0,
      percentage: 4.0,
      calculatedValue: 1191.60,
      status: CommissionStatus.CALCULADA,
    },
  });

  // Campaign 2 - Casa client
  await prisma.commission.create({
    data: {
      campaignId: campaign2.id,
      employeeId: executive.id,
      ruleId: ruleExecCasa.id,
      basis: CommissionBasis.VALOR_VENDIDO,
      baseValue: 80000.0,
      percentage: 5.0,
      calculatedValue: 4000.0,
      status: CommissionStatus.CALCULADA,
    },
  });

  await prisma.commission.create({
    data: {
      campaignId: campaign2.id,
      employeeId: operationMgr.id,
      ruleId: ruleOpCasa.id,
      basis: CommissionBasis.MARGEM,
      baseValue: 44880.0,
      percentage: 3.0,
      calculatedValue: 1346.40,
      status: CommissionStatus.CALCULADA,
    },
  });

  console.log('Commissions created.');

  // ==================== AUDIT LOG ====================
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SEED',
      entity: 'System',
      entityId: null,
      newData: { message: 'Database seeded successfully' },
      ipAddress: '127.0.0.1',
    },
  });

  console.log('Audit log created.');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
