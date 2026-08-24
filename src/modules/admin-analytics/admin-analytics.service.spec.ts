import { NotFoundException } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';

function modelReturning(value: unknown[]) {
  return {
    find: jest.fn(() => ({
      lean: () => ({ exec: jest.fn().mockResolvedValue(value) }),
    })),
  };
}

describe('AdminAnalyticsService', () => {
  const user = {
    _id: 'user-1',
    name: 'An Nguyen',
    email: 'an@maison.test',
    role: 'user',
    createdAt: new Date('2026-08-10T00:00:00.000Z'),
    profile: {},
  };

  it('reads MongoDB collections and returns customer summaries', async () => {
    const service = new AdminAnalyticsService(
      modelReturning([]) as never,
      modelReturning([user]) as never,
      modelReturning([]) as never,
      modelReturning([]) as never,
    );

    const customers = await service.getCustomers();

    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({
      _id: 'user-1',
      email: 'an@maison.test',
    });
  });

  it('rejects an unknown customer id', async () => {
    const service = new AdminAnalyticsService(
      modelReturning([]) as never,
      modelReturning([user]) as never,
      modelReturning([]) as never,
      modelReturning([]) as never,
    );

    await expect(service.getCustomer('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
