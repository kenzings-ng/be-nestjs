import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { User, UserRole } from '../users/schema/user.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService verification-aware sessions', () => {
  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByVerificationTokenHash: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
    decode: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'jwt.accessSecret': 'access-secret',
        'jwt.accessExpiresIn': '15m',
        'jwt.refreshSecret': 'refresh-secret',
        'jwt.refreshExpiresIn': '7d',
        'app.frontendUrl': 'http://localhost:4200',
      };
      return values[key];
    }),
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'jwt.accessSecret': 'access-secret',
        'jwt.refreshSecret': 'refresh-secret',
      };
      return values[key];
    }),
  };
  const mailService = {
    sendVerificationEmail: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    jwtService.decode.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    });
    mailService.sendVerificationEmail.mockResolvedValue(undefined);
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
      mailService as unknown as MailService,
    );
  });

  it('registers an unverified user and still returns a session', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockImplementation(
      async (data: {
        email: string;
        password: string;
        name: string;
        isVerified?: boolean;
      }) => createUser(data),
    );

    const result = await service.register({
      email: 'new@maison.test',
      password: 'password123',
      name: 'New Customer',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ isVerified: false }),
    );
    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { email: 'new@maison.test', isVerified: false },
    });
    expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('allows an unverified user to log in and receive a session', async () => {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 4);
    usersService.findByEmail.mockResolvedValue(
      createUser({
        email: 'pending@maison.test',
        password: hashedPassword,
        name: 'Pending Customer',
        isVerified: false,
      }),
    );

    const result = await service.login({
      email: 'pending@maison.test',
      password,
      rememberMe: false,
    });

    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { email: 'pending@maison.test', isVerified: false },
    });
  });

  it('loads the current verification state from the database', async () => {
    usersService.findById.mockResolvedValue(
      createUser({
        email: 'verified@maison.test',
        password: 'hashed-password',
        name: 'Verified Customer',
        isVerified: true,
      }),
    );

    const result = await service.getCurrentUser('user-id');

    expect(usersService.findById).toHaveBeenCalledWith('user-id');
    expect(result).toMatchObject({
      email: 'verified@maison.test',
      isVerified: true,
    });
  });

  it('confirms verification without asking an already signed-in user to log in', async () => {
    const user = createUser({
      email: 'pending@maison.test',
      password: 'hashed-password',
      name: 'Pending Customer',
      isVerified: false,
    });
    user.verificationTokenHash = 'stored-hash';
    user.verificationTokenExpires = new Date(Date.now() + 60_000);
    usersService.findByVerificationTokenHash.mockResolvedValue(user);

    const result = await service.verifyEmail('verification-token');

    expect(result).toEqual({ message: 'Email verified successfully.' });
    expect(user.isVerified).toBe(true);
    expect(user.verificationTokenHash).toBeUndefined();
    expect(user.verificationTokenExpires).toBeUndefined();
  });
});

function createUser(data: {
  email: string;
  password: string;
  name: string;
  isVerified?: boolean;
}): User {
  return {
    _id: 'user-id',
    email: data.email,
    password: data.password,
    name: data.name,
    role: UserRole.USER,
    isVerified: data.isVerified ?? false,
    refreshTokens: [],
    save: jest.fn().mockResolvedValue(undefined),
  } as unknown as User;
}
