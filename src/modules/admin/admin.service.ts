import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { plainToClass, plainToInstance } from 'class-transformer';
import { FindManyOptions, FindOneOptions, IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities and DTOs
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create.admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { LoginAdminDto } from './dto/login.admin.dto';
import { ChangePasswordDto } from './dto/change.password.dto';
import { AssignRoleDto } from './dto/assign.role.dto';
import { RemoveRoleDto } from './dto/remove.role.dto';

// Services
import { RoleService } from '@modules/role/role.service';
import { AuthService } from '@modules/auth/auth.service';
import { TokenService } from '@modules/token/token.service';
import { UserService } from '@modules/user/user.service';

// Constants and Types
import { AUTH_ERROR, ERROR } from '@shared/constants/messages';

import { JwtPayload } from '@shared/interfaces/interfaces';

import { TokenTypeEnum } from '@shared/constants/enum';

// Helpers and Utilities

import { generateTokens } from '@shared/helpers/common.functions';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Admin)
        private readonly adminRepository: Repository<Admin>,
        private readonly roleservice: RoleService,
        private readonly authService: AuthService,
        private readonly tokenService: TokenService,
        private readonly roleService: RoleService,
        private readonly userService: UserService,
    ) {}
    async create(createAdminDto: CreateAdminDto) {
        const result = await this.adminRepository.save(createAdminDto);
        return plainToClass(Admin, result);
    }

    async findAllWithCount(where: FindManyOptions<Admin>) {
        const [list, count] = await this.adminRepository.findAndCount(where);
        return [plainToInstance(Admin, list), count];
    }

    async findAll(): Promise<[Admin[]]> {
        const list = await this.adminRepository.find();
        return [plainToInstance(Admin, list)];
    }

    async count(where: FindManyOptions<Admin>) {
        const count = await this.adminRepository.count(where);
        return count;
    }

    async findOne(id: string) {
        const record = await this.adminRepository.findOne({ where: { id } });
        return plainToClass(Admin, record);
    }

    async findOneWhere(where: FindOneOptions<Admin>) {
        const record = await this.adminRepository.findOne(where);
        return record;
    }

    async update(id: string, updateAdminDto: UpdateAdminDto) {
        const record = await this.adminRepository.update(id, updateAdminDto);
        if (record.affected === 0) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return record;
    }

    async remove(id: string) {
        const record = await this.adminRepository.update(
            { id: id, deleted_at: IsNull() },
            {
                deleted_at: new Date().toISOString(),
            },
        );
        if (record.affected === 0) {
            throw new NotFoundException(`Admin with ID ${id} not found`);
        }
        return record;
    }

    async validateAdmin(userId: string): Promise<boolean> {
        const admin = await this.adminRepository.findOne({ where: { id: userId } });
        return !!admin;
    }

    async getAdminRole(userId: string): Promise<string> {
        const user = await this.adminRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });

        if (!user) {
            return null;
        }

        return user.role.role_name;
    }

    async isAdmin(userId: string): Promise<boolean> {
        const admin = await this.adminRepository.findOne({ where: { id: userId } });
        return !!admin;
    }

    async adminSignUp(createAdminDto: CreateAdminDto): Promise<void> {
        const isDuplicate = await this.findOneWhere({
            where: { email: createAdminDto.email },
        });

        if (isDuplicate) {
            throw new ConflictException(ERROR.ALREADY_EXISTS('Admin'));
        }

        createAdminDto.password = await this.authService.hashPassword(createAdminDto.password);

        const createObj = Object.assign({}, createAdminDto, {
            role: await this.roleservice.findOneWhere({ where: { role_name: 'admin' } }),
        });

        await this.create(createObj);
    }

    async adminLogin(loginAdminDto: LoginAdminDto): Promise<object> {
        const isExists = await this.findOneWhere({
            where: { email: loginAdminDto.email },
            relations: ['role'],
        });

        if (!isExists) {
            throw new UnauthorizedException(AUTH_ERROR.UNAUTHENTICATED);
        }

        const isValidPassword = await this.authService.validatePassword(loginAdminDto.password, isExists.password);

        if (!isValidPassword) {
            throw new UnauthorizedException(AUTH_ERROR.WRONG_CREDENTIALS);
        }

        const payload: JwtPayload = {
            email: isExists.email,
            id: isExists.id,
            roleName: isExists.role.role_name,
        };

        const { accessToken, accessTokenExpiryTime } = generateTokens(payload);

        await this.tokenService.create({
            entity: isExists,
            access_token: accessToken,
            access_token_expiry: accessTokenExpiryTime,
            type: TokenTypeEnum.ACCESS,
        });

        const result = {
            id: payload.id,
            email: payload.email,
            access_token: accessToken,
        };
        return result;
    }

    async changeAdminPassword(adminId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
        const isExists = await this.findOneWhere({
            where: { id: adminId },
        });

        if (!isExists) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('Admin'));
        }

        const isValidPassword = await this.authService.validatePassword(
            changePasswordDto.old_password,
            isExists.password,
        );

        if (!isValidPassword) {
            throw new UnauthorizedException(AUTH_ERROR.WRONG_CREDENTIALS);
        }

        const hashedPassword = await this.authService.hashPassword(changePasswordDto.new_password);
        await this.update(adminId, {
            password: hashedPassword,
        });
    }

    async adminLogout(adminId: string, req): Promise<void> {
        if (!req.token) {
            throw new UnauthorizedException(AUTH_ERROR.UNAUTHORIZED);
        }
        const isExists = await this.findOneWhere({
            where: { id: adminId },
            relations: ['role'],
        });

        if (!isExists) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('Admin'));
        }

        const tokenRecord = await this.tokenService.findOneWhere({
            where: { admin: { id: isExists.id }, access_token: req.token },
        });

        if (tokenRecord) {
            // Invalidate the token
            await this.tokenService.invalidateToken(tokenRecord, TokenTypeEnum.ACCESS);
        }
    }

    async assignRole(assignRoleDto: AssignRoleDto): Promise<void> {
        const { user_id, role_id } = assignRoleDto;

        const user = await this.userService.findOneWhere({
            where: { id: user_id },
            relations: ['role'],
        });

        if (!user) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('User'));
        }

        const role = await this.roleService.findOne(role_id);
        if (!role) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('Role'));
        }

        user.role = role;
        await this.userService.update(user.id, user);
    }

    async removeRole(removeRoleDto: RemoveRoleDto): Promise<void> {
        const { user_id, role_id } = removeRoleDto;

        const user = await this.userService.findOneWhere({
            where: { id: user_id },
            relations: ['role'],
        });

        if (!user) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('User'));
        }

        const role = await this.roleService.findOne(role_id);
        if (!role) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('Role'));
        }

        if (user.role.id !== role_id) {
            throw new BadRequestException(AUTH_ERROR.INVALID_ROLE);
        }

        const defaultRole = await this.roleService.findOneWhere({ where: { role_name: 'user' } });
        user.role = defaultRole;

        await this.userService.update(user.id, user);
    }
}
