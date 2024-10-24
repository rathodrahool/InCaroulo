import { Test, TestingModule } from '@nestjs/testing';
import { DeviceInformationService } from './device.information.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { DeviceInformation } from './entities/device.information.entity';
import { DeviceInformationDto } from './dto/device.information.dto';
import { TokenService } from '@modules/token/token.service';
import { plainToClass } from 'class-transformer';
import { ActivityType, DeviceType } from '@root/src/shared/constants/enum';
import { User } from '../../user/entities/user.entity';

describe('DeviceInformationService', () => {
    let service: DeviceInformationService;
    let deviceRepository: Repository<DeviceInformation>;
    let tokenService: TokenService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeviceInformationService,
                {
                    provide: getRepositoryToken(DeviceInformation),
                    useValue: {
                        save: jest.fn(),
                    },
                },
                {
                    provide: TokenService,
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get<DeviceInformationService>(DeviceInformationService);
        deviceRepository = module.get<Repository<DeviceInformation>>(getRepositoryToken(DeviceInformation));
        tokenService = module.get<TokenService>(TokenService);
    });

    describe('create', () => {
        it('should save and return device information', async () => {
            const createDeviceDto: DeviceInformationDto = {
                // Populate with necessary fields
                device_id: 'device-id',
                device_type: DeviceType.WEB,
                device_name: 'DeviceName',
                device_ip: '192.168.1.1',
                app_version: '1.0.0',
                timezone: 'UTC',
                activity_type: ActivityType.LOGIN, // Use actual activity type from your constants
                user: null, // Populate with an instance if needed
                admin: null, // Populate with an instance if needed
                registered_at: new Date(),
                is_active: true,
                last_active_at: new Date(),
                link_id: 'link-id',
            };

            const savedDevice = plainToClass(DeviceInformation, createDeviceDto);

            deviceRepository.save = jest.fn().mockResolvedValue(savedDevice);

            const result = await service.create(createDeviceDto);

            expect(result).toEqual(savedDevice);
            expect(deviceRepository.save).toHaveBeenCalledWith(createDeviceDto);
            expect(deviceRepository.save).toHaveBeenCalledTimes(1);
        });
    });

    describe('findOneWhere', () => {
        it('should find and return a device information record', async () => {
            const findOptions: FindOneOptions<DeviceInformation> = {
                where: { device_id: 'device-id' },
            };

            const foundDevice = new DeviceInformation();
            // Populate with necessary fields if needed
            foundDevice.device_id = 'device-id';
            foundDevice.device_type = DeviceType.WEB;

            deviceRepository.findOne = jest.fn().mockResolvedValue(foundDevice);

            const result = await service.findOneWhere(findOptions);

            expect(result).toEqual(foundDevice);
            expect(deviceRepository.findOne).toHaveBeenCalledWith(findOptions);
            expect(deviceRepository.findOne).toHaveBeenCalledTimes(1);
        });

        it('should return null if no record is found', async () => {
            const findOptions: FindOneOptions<DeviceInformation> = {
                where: { device_id: 'non-existent-device-id' },
            };

            deviceRepository.findOne = jest.fn().mockResolvedValue(null);

            const result = await service.findOneWhere(findOptions);

            expect(result).toBeNull();
            expect(deviceRepository.findOne).toHaveBeenCalledWith(findOptions);
            expect(deviceRepository.findOne).toHaveBeenCalledTimes(1);
        });
    });

    describe('update', () => {
        it('should update a device information record', async () => {
            const id = 'device-id';
            const updateDeviceInfoDto: Partial<DeviceInformationDto> = {
                device_type: DeviceType.IOS,
                device_name: 'iPhone',
            };

            // Mock the update method to resolve successfully
            deviceRepository.update = jest.fn().mockResolvedValue(undefined);

            await service.update(id, updateDeviceInfoDto);

            expect(deviceRepository.update).toHaveBeenCalledWith(id, updateDeviceInfoDto);
            expect(deviceRepository.update).toHaveBeenCalledTimes(1);
        });

        it('should handle errors during update', async () => {
            const id = 'device-id';
            const updateDeviceInfoDto: Partial<DeviceInformationDto> = {
                device_type: DeviceType.IOS,
                device_name: 'iPhone',
            };

            // Mock the update method to throw an error
            deviceRepository.update = jest.fn().mockRejectedValue(new Error('Update failed'));

            await expect(service.update(id, updateDeviceInfoDto)).rejects.toThrow('Update failed');

            expect(deviceRepository.update).toHaveBeenCalledWith(id, updateDeviceInfoDto);
            expect(deviceRepository.update).toHaveBeenCalledTimes(1);
        });
    });

    describe('logoutAllDevice', () => {
        it('should log out all devices if multiple device login is not allowed', async () => {
            process.env.ALLOW_MULTIPLE_DEVICE_LOGIN = '';

            const user = new User();
            user.id = 'user-id';

            const activeTokens = [{ device: { id: 'device-id-1' } }, { device: { id: 'device-id-2' } }];

            tokenService.findActiveTokens = jest.fn().mockResolvedValue(activeTokens);
            tokenService.invalidateToken = jest.fn().mockResolvedValue(undefined);
            deviceRepository.update = jest.fn().mockResolvedValue(undefined);

            await service.logoutAllDevice(user);

            expect(tokenService.findActiveTokens).toHaveBeenCalledWith(user);
            expect(tokenService.invalidateToken).toHaveBeenCalledTimes(2);
            expect(deviceRepository.update).toHaveBeenCalledTimes(2);
            expect(deviceRepository.update).toHaveBeenCalledWith('device-id-1', {
                is_active: false,
                last_active_at: expect.any(Date),
                activity_type: ActivityType.LOGOUT,
            });
            expect(deviceRepository.update).toHaveBeenCalledWith('device-id-2', {
                is_active: false,
                last_active_at: expect.any(Date),
                activity_type: ActivityType.LOGOUT,
            });
        });

        it('should not log out devices if multiple device login is allowed', async () => {
            process.env.ALLOW_MULTIPLE_DEVICE_LOGIN = 'true';

            const user = new User();
            user.id = 'user-id';

            tokenService.findActiveTokens = jest.fn();
            tokenService.invalidateToken = jest.fn();
            deviceRepository.update = jest.fn();

            await service.logoutAllDevice(user);

            expect(tokenService.findActiveTokens).not.toHaveBeenCalled();
            expect(tokenService.invalidateToken).not.toHaveBeenCalled();
            expect(deviceRepository.update).not.toHaveBeenCalled();
        });
    });
});
