const prisma = require('../db');
const { CheckerError, getMyCheckerSetup, configureFromId, listCheckerStudents, checkerTool } = require('./checkerService');

const LOGIN = 'prenom.nom@epitech.eu';
const PAIR = '33b5f0a3-402d3bca-79b7d899-704395ca';

async function resetDb() {
  await prisma.participation.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

describe('checker service', () => {
  let workshop, student;

  beforeEach(async () => {
    process.env.WORKSHOP_SECRET = 'test-secret';
    delete process.env.PUBLIC_API_URL;
    await resetDb();
    student = await prisma.user.create({ data: { name: 'Prenom Nom', email: LOGIN, role: 'student' } });
    workshop = await prisma.workshop.create({ data: { title: 'Git', description: 'd', slug: 'git-workshop' } });
    await prisma.participation.create({ data: { studentId: student.id, workshopId: workshop.id } });
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe('configureFromId', () => {
    it('returns the pairing code for the id shown to the student', async () => {
      expect(await configureFromId(prisma, '2369-6B46-4285')).toBe(PAIR);
    });

    it('accepts the id as the script sends it: no dashes, any case', async () => {
      expect(await configureFromId(prisma, '23696b464285')).toBe(PAIR);
    });

    it('records that the student configured the workstation', async () => {
      await configureFromId(prisma, '2369-6B46-4285');
      const configs = await prisma.checkerConfig.findMany();
      expect(configs).toHaveLength(1);
      expect(configs[0]).toMatchObject({ studentId: student.id, workshopId: workshop.id });
    });

    it('keeps a single record when the student configures twice', async () => {
      await configureFromId(prisma, '2369-6B46-4285');
      await configureFromId(prisma, '2369-6B46-4285');
      expect(await prisma.checkerConfig.count()).toBe(1);
    });

    it('answers 404 for an unknown code', async () => {
      await expect(configureFromId(prisma, 'AAAA-BBBB-CCCC')).rejects.toMatchObject({ status: 404, message: 'unknown code' });
    });

    it('answers 404 for an empty code', async () => {
      await expect(configureFromId(prisma, '')).rejects.toMatchObject({ status: 404 });
      await expect(configureFromId(prisma, undefined)).rejects.toMatchObject({ status: 404 });
    });

    it('answers 404 when the student did not join the workshop', async () => {
      await prisma.participation.deleteMany();
      await expect(configureFromId(prisma, '2369-6B46-4285')).rejects.toMatchObject({ status: 404 });
    });

    it('answers 404 when the workshop has no slug', async () => {
      await prisma.workshop.update({ where: { id: workshop.id }, data: { slug: null } });
      await expect(configureFromId(prisma, '2369-6B46-4285')).rejects.toMatchObject({ status: 404 });
    });

    it('fails without leaking anything when the secret is missing', async () => {
      delete process.env.WORKSHOP_SECRET;
      const error = await configureFromId(prisma, '2369-6B46-4285').catch((e) => e);
      expect(error).toBeInstanceOf(CheckerError);
      expect(error.status).toBe(500);
      expect(error.message).not.toContain('test-secret');
    });
  });

  describe('getMyCheckerSetup', () => {
    it('gives the student their codes', async () => {
      expect(await getMyCheckerSetup(prisma, workshop.id, student.id)).toMatchObject({
        slug: 'git-workshop',
        id: '2369-6B46-4285',
        pair: PAIR,
        apiUrl: null,
        configuredAt: null,
      });
    });

    it('gives the public API url when it is set', async () => {
      process.env.PUBLIC_API_URL = 'https://epiwork.example.com/api';
      const setup = await getMyCheckerSetup(prisma, workshop.id, student.id);
      expect(setup.apiUrl).toBe('https://epiwork.example.com/api');
    });

    it('shows when the workstation was configured', async () => {
      await configureFromId(prisma, '2369-6B46-4285');
      const setup = await getMyCheckerSetup(prisma, workshop.id, student.id);
      expect(setup.configuredAt).toBeInstanceOf(Date);
    });

    it('never contains the secret', async () => {
      const setup = await getMyCheckerSetup(prisma, workshop.id, student.id);
      expect(JSON.stringify(setup)).not.toContain('test-secret');
    });

    it('answers 404 to a student who did not join the workshop', async () => {
      const other = await prisma.user.create({ data: { name: 'Other', email: 'other@epitech.eu', role: 'student' } });
      await expect(getMyCheckerSetup(prisma, workshop.id, other.id)).rejects.toMatchObject({ status: 404 });
    });

    it('answers 404 when the workshop has no slug', async () => {
      await prisma.workshop.update({ where: { id: workshop.id }, data: { slug: null } });
      await expect(getMyCheckerSetup(prisma, workshop.id, student.id)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('listCheckerStudents', () => {
    it('lists the students with and without a configured workstation', async () => {
      const other = await prisma.user.create({ data: { name: 'Zed', email: 'zed@epitech.eu', role: 'student' } });
      await prisma.participation.create({ data: { studentId: other.id, workshopId: workshop.id } });
      await configureFromId(prisma, '2369-6B46-4285');
      const list = await listCheckerStudents(prisma, workshop.id);
      expect(list.map((s) => [s.email, s.configuredAt !== null])).toEqual([
        [LOGIN, true],
        ['zed@epitech.eu', false],
      ]);
    });
  });

  describe('checkerTool', () => {
    it('gives the id, the pairing code and the flag of an exercise', () => {
      expect(checkerTool({ slug: 'git-workshop', login: LOGIN, exo: '02' })).toEqual({
        id: '2369-6B46-4285',
        pair: PAIR,
        flag: 'EPI{9ec814dfadafb4df}',
      });
    });

    it('skips the flag when no exercise is given', () => {
      expect(checkerTool({ slug: 'git-workshop', login: LOGIN, exo: null }).flag).toBeNull();
    });

    it('requires a slug and a login', () => {
      expect(() => checkerTool({ slug: '', login: LOGIN })).toThrow(CheckerError);
      expect(() => checkerTool({ slug: 'git-workshop', login: '' })).toThrow(CheckerError);
    });
  });
});
