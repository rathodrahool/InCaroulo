import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenService } from './token.service';
import { Tokens } from './entities/tokens.entity';

import { Admin } from '../admin/entities/admin.entity';
import { User } from '../user/entities/user.entity';
import { DefaultStatus, TokenTypeEnum } from '@root/src/shared/constants/enum';
import { DeviceInformation } from '../auth/device-information/entities/device.information.entity';
import { plainToClass } from 'class-transformer';

describe('TokenService', () => {
    let service: TokenService;
    const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
    };

    const mockTokenRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOneWhere: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockUser = new User();
    const mockAdmin = new Admin();
    const mockToken = new Tokens();
    const mockDevice = new DeviceInformation();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenService,
                {
                    provide: getRepositoryToken(Tokens),
                    useValue: mockTokenRepository,
                },
            ],
        }).compile();

        service = module.get<TokenService>(TokenService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should successfully create a token for a User', async () => {
            const options = {
                entity: mockUser,
                access_token: 'test_access_token',
                access_token_expiry: new Date(),
                refresh_token: 'test_refresh_token',
                refresh_token_expiry: new Date(),
                type: TokenTypeEnum.ACCESS,
                device: mockDevice,
            };

            mockTokenRepository.create.mockReturnValue(mockToken);
            mockTokenRepository.save.mockResolvedValue(mockToken);

            const result = await service.create(options);

            expect(mockTokenRepository.create).toHaveBeenCalledWith({
                access_token: options.access_token,
                access_token_expiry: options.access_token_expiry,
                refresh_token: options.refresh_token,
                refresh_token_expiry: options.refresh_token_expiry,
                type: options.type,
                device: options.device,
            });

            expect(mockToken.user).toBe(mockUser);

            expect(mockTokenRepository.save).toHaveBeenCalledWith(mockToken);
            expect(result).toEqual(mockToken);
        });

        it('should successfully create a token for an Admin', async () => {
            const options = {
                entity: mockAdmin,
                access_token: 'test_access_token',
                access_token_expiry: new Date(),
                refresh_token: 'test_refresh_token',
                refresh_token_expiry: new Date(),
                type: TokenTypeEnum.ACCESS,
                device: mockDevice,
            };

            mockTokenRepository.create.mockReturnValue(mockToken);
            mockTokenRepository.save.mockResolvedValue(mockToken);

            const result = await service.create(options);

            expect(mockTokenRepository.create).toHaveBeenCalledWith({
                access_token: options.access_token,
                access_token_expiry: options.access_token_expiry,
                refresh_token: options.refresh_token,
                refresh_token_expiry: options.refresh_token_expiry,
                type: options.type,
                device: options.device,
            });

            expect(mockToken.admin).toBe(mockAdmin);

            expect(mockTokenRepository.save).toHaveBeenCalledWith(mockToken);
            expect(result).toEqual(mockToken);
        });

        it('should create a token with default type if type is not provided', async () => {
            const options = {
                entity: mockUser,
                access_token: 'test_access_token',
                access_token_expiry: new Date(),
                refresh_token: 'test_refresh_token',
                refresh_token_expiry: new Date(),
                device: mockDevice,
            };

            mockTokenRepository.create.mockReturnValue(mockToken);
            mockTokenRepository.save.mockResolvedValue(mockToken);

            const result = await service.create(options);

            expect(mockTokenRepository.create).toHaveBeenCalledWith({
                access_token: options.access_token,
                access_token_expiry: options.access_token_expiry,
                refresh_token: options.refresh_token,
                refresh_token_expiry: options.refresh_token_expiry,
                type: TokenTypeEnum.ACCESS,
                device: options.device,
            });

            expect(mockToken.user).toBe(mockUser);

            expect(mockTokenRepository.save).toHaveBeenCalledWith(mockToken);
            expect(result).toEqual(mockToken);
        });
    });
    describe('findOneWhere', () => {
        it('should successfully find a token by the given criteria', async () => {
            const where = { where: { id: '1' } };

            mockTokenRepository.findOne.mockResolvedValue(mockToken);

            const result = await service.findOneWhere(where);

            expect(mockTokenRepository.findOne).toHaveBeenCalledWith(where);

            expect(result).toEqual(plainToClass(Tokens, mockToken));
        });

        it('should return null if no token is found', async () => {
            const where = { where: { id: 'non_existing_token_id' } };

            mockTokenRepository.findOne.mockResolvedValue(null);

            const result = await service.findOneWhere(where);

            expect(mockTokenRepository.findOne).toHaveBeenCalledWith(where);

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update a token with the given updateTokenDto', async () => {
            const id = 'test_token_id';
            const updateTokenDto = { access_token: 'updated_access_token' };

            mockTokenRepository.update.mockResolvedValue(null);

            await service.update(id, updateTokenDto);

            expect(mockTokenRepository.update).toHaveBeenCalledWith(id, updateTokenDto);
        });

        it('should not throw an error when updating a non-existing token', async () => {
            const id = 'non_existing_token_id';
            const updateTokenDto = { access_token: 'updated_access_token' };

            mockTokenRepository.update.mockResolvedValue(null);

            await expect(service.update(id, updateTokenDto)).resolves.not.toThrow();

            expect(mockTokenRepository.update).toHaveBeenCalledWith(id, updateTokenDto);
        });
    });
    describe('findTokenRecord', () => {
        it('should successfully find a token record with the given link_id and activity', async () => {
            const link_id = 'test_link_id';
            const activity = 'test_activity';

            mockQueryBuilder.getOne.mockResolvedValue(mockToken);

            const result = await service.findTokenRecord(link_id, activity);

            expect(mockTokenRepository.createQueryBuilder).toHaveBeenCalledWith('tokens');

            expect(mockQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('tokens.device', 'device');
            expect(mockQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('device.user', 'user');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('device.link_id = :link_id', { link_id });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('device.activity_type = :activityType', {
                activityType: activity,
            });

            expect(mockQueryBuilder.getOne).toHaveBeenCalled();
            expect(result).toEqual(mockToken);
        });

        it('should return null if no token is found', async () => {
            const link_id = 'invalid_link_id';
            const activity = 'invalid_activity';

            mockQueryBuilder.getOne.mockResolvedValue(null);

            const result = await service.findTokenRecord(link_id, activity);

            expect(mockTokenRepository.createQueryBuilder).toHaveBeenCalledWith('tokens');
            expect(mockQueryBuilder.getOne).toHaveBeenCalled();

            expect(result).toBeNull();
        });
    });

    describe('invalidateToken', () => {
        it('should set access_token_status to IN_ACTIVE when tokenType is ACCESS', async () => {
            const token = { ...mockToken, access_token_status: DefaultStatus.ACTIVE };
            const tokenType = TokenTypeEnum.ACCESS;

            await service.invalidateToken(token, tokenType);

            expect(token.access_token_status).toBe(DefaultStatus.IN_ACTIVE);

            expect(mockTokenRepository.save).toHaveBeenCalledWith(token);
        });

        it('should set refresh_token_status to IN_ACTIVE when tokenType is REFRESH', async () => {
            const token = { ...mockToken, refresh_token_status: DefaultStatus.ACTIVE };
            const tokenType = TokenTypeEnum.REFRESH;

            await service.invalidateToken(token, tokenType);

            expect(token.refresh_token_status).toBe(DefaultStatus.IN_ACTIVE);

            expect(mockTokenRepository.save).toHaveBeenCalledWith(token);
        });

        it('should not modify other statuses when invalidating access token', async () => {
            const token = {
                ...mockToken,
                access_token_status: DefaultStatus.ACTIVE,
                refresh_token_status: DefaultStatus.ACTIVE,
            };
            const tokenType = TokenTypeEnum.ACCESS;

            await service.invalidateToken(token, tokenType);
            expect(token.access_token_status).toBe(DefaultStatus.IN_ACTIVE);
            expect(token.refresh_token_status).toBe(DefaultStatus.ACTIVE);

            expect(mockTokenRepository.save).toHaveBeenCalledWith(token);
        });

        it('should not modify other statuses when invalidating refresh token', async () => {
            const token = {
                ...mockToken,
                access_token_status: DefaultStatus.ACTIVE,
                refresh_token_status: DefaultStatus.ACTIVE,
            };
            const tokenType = TokenTypeEnum.REFRESH;

            await service.invalidateToken(token, tokenType);

            expect(token.refresh_token_status).toBe(DefaultStatus.IN_ACTIVE);
            expect(token.access_token_status).toBe(DefaultStatus.ACTIVE);

            expect(mockTokenRepository.save).toHaveBeenCalledWith(token);
        });
    });
    describe('validateToken', () => {
        it('should return false if no token is found', async () => {
            const token = 'some-token';
            const tokenType = TokenTypeEnum.ACCESS;

            mockTokenRepository.findOne = jest.fn().mockResolvedValue(null);

            const result = await service.validateToken(token, tokenType);

            expect(mockTokenRepository.findOne).toHaveBeenCalledWith({ where: { access_token: token } });
            expect(result).toBe(false);
        });

        it('should return false for an inactive access token', async () => {
            const token = 'some-token';
            const tokenType = TokenTypeEnum.ACCESS;

            const foundToken = {
                access_token_status: DefaultStatus.IN_ACTIVE,
                access_token_expiry: new Date(Date.now() + 10000),
                refresh_token_status: DefaultStatus.ACTIVE,
                refresh_token_expiry: new Date(Date.now() + 10000),
            };

            mockTokenRepository.findOne = jest.fn().mockResolvedValue(foundToken);

            const result = await service.validateToken(token, tokenType);

            expect(mockTokenRepository.findOne).toHaveBeenCalledWith({ where: { access_token: token } });
            expect(result).toBe(false);
        });

        it('should return false for an active but expired access token', async () => {
            const token = 'some-token';
            const tokenType = TokenTypeEnum.ACCESS;

            const foundToken = {
                access_token_status: DefaultStatus.ACTIVE,
                access_token_expiry: new Date(Date.now() - 10000), // expired
                refresh_token_status: DefaultStatus.ACTIVE,
                refresh_token_expiry: new Date(Date.now() + 10000),
            };

            mockTokenRepository.findOne = jest.fn().mockResolvedValue(foundToken);

            const result = await service.validateToken(token, tokenType);

            expect(mockTokenRepository.findOne).toHaveBeenCalledWith({ where: { access_token: token } });
            expect(result).toBe(false);
        });

        it('should return true for a valid active and non-expired access token', async () => {
            const token = 'some-token';
            const tokenType = TokenTypeEnum.ACCESS;

            const foundToken = {
                access_token_status: DefaultStatus.ACTIVE,
                access_token_expiry: new Date(Date.now() + 10000), // valid
                refresh_token_status: DefaultStatus.ACTIVE,
                refresh_token_expiry: new Date(Date.now() + 10000),
            };

            mockTokenRepository.findOne = jest.fn().mockResolvedValue(foundToken);

            const result = await service.validateToken(token, tokenType);

            expect(mockTokenRepository.findOne).toHaveBeenCalledWith({ where: { access_token: token } });
            expect(result).toBe(true);
        });

        it('should return false for an inactive refresh token', async () => {
            const token = 'some-token';
            const tokenType = TokenTypeEnum.REFRESH;

            const foundToken = {
                access_token_status: DefaultStatus.ACTIVE,
                access_token_expiry: new Date(Date.now() + 10000),
                refresh_token_status: DefaultStatus.IN_ACTIVE,
                refresh_token_expiry: new Date(Date.now() + 10000),
            };

            mockTokenRepository.findOne = jest.fn().mockResolvedValue(foundToken);

            const result = await service.validateToken(token, tokenType);

            expect(mockTokenRepository.findOne).toHaveBeenCalledWith({ where: { refresh_token: token } });
            expect(result).toBe(false);
        });

        it('should return false for an active but expired refresh token', async () => {
            const token = 'some-token';
            const tokenType = TokenTypeEnum.REFRESH;

            const foundToken = {
                access_token_status: DefaultStatus.ACTIVE,
                access_token_expiry: new Date(Date.now() + 10000),
                refresh_token_status: DefaultStatus.ACTIVE,
                refresh_token_expiry: new Date(Date.now() - 10000),
            };

            mockTokenRepository.findOne = jest.fn().mockResolvedValue(foundToken);

            const result = await service.validateToken(token, tokenType);

            expect(mockTokenRepository.findOne).toHaveBeenCalledWith({ where: { refresh_token: token } });
            expect(result).toBe(false);
        });

        it('should return true for a valid active and non-expired refresh token', async () => {
            const token = 'some-token';
            const tokenType = TokenTypeEnum.REFRESH;

            const foundToken = {
                access_token_status: DefaultStatus.ACTIVE,
                access_token_expiry: new Date(Date.now() + 10000),
                refresh_token_status: DefaultStatus.ACTIVE,
                refresh_token_expiry: new Date(Date.now() + 10000),
            };

            mockTokenRepository.findOne = jest.fn().mockResolvedValue(foundToken);

            const result = await service.validateToken(token, tokenType);

            expect(mockTokenRepository.findOne).toHaveBeenCalledWith({ where: { refresh_token: token } });
            expect(result).toBe(true);
        });
    });

    describe('findActiveTokens', () => {
        const mockTokens = [new Tokens(), new Tokens()];
        it('should return active tokens for a User', async () => {
            mockQueryBuilder.getMany.mockResolvedValue(mockTokens);

            const result = await service.findActiveTokens(mockUser);

            expect(mockTokenRepository.createQueryBuilder).toHaveBeenCalledWith('token');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('token.device', 'device');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'token.access_token_status = :accessStatus AND token.access_token_expiry > :now OR ' +
                    'token.refresh_token_status = :refreshStatus AND token.refresh_token_expiry > :now',
                {
                    accessStatus: DefaultStatus.ACTIVE,
                    refreshStatus: DefaultStatus.ACTIVE,
                    now: expect.any(Date),
                },
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('token.user_id = :id', { id: mockUser.id });
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
            expect(result).toEqual(mockTokens);
        });

        it('should return active tokens for an Admin', async () => {
            mockQueryBuilder.getMany.mockResolvedValue(mockTokens);

            const result = await service.findActiveTokens(mockAdmin);

            expect(mockTokenRepository.createQueryBuilder).toHaveBeenCalledWith('token');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('token.device', 'device');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'token.access_token_status = :accessStatus AND token.access_token_expiry > :now OR ' +
                    'token.refresh_token_status = :refreshStatus AND token.refresh_token_expiry > :now',
                {
                    accessStatus: DefaultStatus.ACTIVE,
                    refreshStatus: DefaultStatus.ACTIVE,
                    now: expect.any(Date),
                },
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('token.admin_id = :id', { id: mockAdmin.id });
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
            expect(result).toEqual(mockTokens);
        });

        it('should return an empty array if no active tokens exist', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await service.findActiveTokens(mockUser);

            expect(mockTokenRepository.createQueryBuilder).toHaveBeenCalledWith('token');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('token.device', 'device');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'token.access_token_status = :accessStatus AND token.access_token_expiry > :now OR ' +
                    'token.refresh_token_status = :refreshStatus AND token.refresh_token_expiry > :now',
                {
                    accessStatus: DefaultStatus.ACTIVE,
                    refreshStatus: DefaultStatus.ACTIVE,
                    now: expect.any(Date),
                },
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('token.user_id = :id', { id: mockUser.id });
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });

    describe('handleTokenCleanup', () => {
        const now = new Date();

        it('should mark expired tokens as inactive and delete inactive tokens', async () => {
            // Mock expired tokens
            const expiredTokens = [
                {
                    id: '1',
                    access_token_status: DefaultStatus.ACTIVE,
                    access_token_expiry: new Date(now.getTime() - 10000),
                    refresh_token_status: DefaultStatus.ACTIVE,
                    refresh_token_expiry: new Date(now.getTime() - 10000),
                },
                {
                    id: '2',
                    access_token_status: DefaultStatus.ACTIVE,
                    access_token_expiry: new Date(now.getTime() - 10000),
                    refresh_token_status: DefaultStatus.IN_ACTIVE,
                    refresh_token_expiry: new Date(now.getTime() - 10000),
                },
            ];

            // Mock inactive tokens
            const inactiveTokens = [
                {
                    id: '3',
                    access_token_status: DefaultStatus.IN_ACTIVE,
                    refresh_token_status: DefaultStatus.IN_ACTIVE,
                },
                {
                    id: '4',
                    access_token_status: DefaultStatus.IN_ACTIVE,
                    refresh_token_status: DefaultStatus.IN_ACTIVE,
                },
            ];

            mockTokenRepository.find.mockResolvedValueOnce(expiredTokens).mockResolvedValueOnce(inactiveTokens);

            mockTokenRepository.save.mockResolvedValue(null);
            mockTokenRepository.delete.mockResolvedValue(null);

            await service.handleTokenCleanup();

            expect(mockTokenRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ id: '1', access_token_status: DefaultStatus.IN_ACTIVE }),
            );
            expect(mockTokenRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ id: '2', access_token_status: DefaultStatus.IN_ACTIVE }),
            );

            expect(mockTokenRepository.delete).toHaveBeenCalledWith('3');
            expect(mockTokenRepository.delete).toHaveBeenCalledWith('4');
        });

        it('should handle no tokens found scenarios gracefully', async () => {
            mockTokenRepository.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

            await service.handleTokenCleanup();

            expect(mockTokenRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.arrayContaining([
                        expect.objectContaining({
                            access_token_status: DefaultStatus.ACTIVE,
                            access_token_expiry: expect.any(Object),
                        }),
                        expect.objectContaining({
                            refresh_token_status: DefaultStatus.ACTIVE,
                            refresh_token_expiry: expect.any(Object),
                        }),
                    ]),
                }),
            );
            expect(mockTokenRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.arrayContaining([
                        expect.objectContaining({
                            access_token_status: DefaultStatus.IN_ACTIVE,
                        }),
                        expect.objectContaining({
                            refresh_token_status: DefaultStatus.IN_ACTIVE,
                        }),
                    ]),
                }),
            );

            expect(mockTokenRepository.save).not.toHaveBeenCalled();
            expect(mockTokenRepository.delete).not.toHaveBeenCalled();
        });
    });
});
