import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    // ✅ Signup method
    async signup(dto: SignupDto) {
        // 1️⃣ Create Tenant
        const tenant = await this.prisma.tenant.create({
            data: { name: dto.tenantName },
        });

        // 2️⃣ Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // 3️⃣ Create Admin User
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: 'ADMIN',
                tenantId: tenant.id,
            },
        });

        // 4️⃣ Issue JWT
        const token = this.jwtService.sign({
            userId: user.id,
            tenantId: tenant.id,
            role: user.role,
        });

        return {
            user: { id: user.id, email: user.email, role: user.role },
            token,
        };
    }

    // ✅ Login method
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) throw new Error('Invalid credentials');

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) throw new Error('Invalid credentials');

        const token = this.jwtService.sign({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
        });

        return {
            user: { id: user.id, email: user.email, role: user.role },
            token,
        };
    }
    async signupUser(email: string, password: string, tenantId: string) {
        // 1️⃣ Check if tenant exists
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new Error('Tenant does not exist');
        }

        // 2️⃣ Check if email already exists
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('Email already in use');
        }

        // 3️⃣ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4️⃣ Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'USER',
                tenantId: tenant.id,
            },
        });

        // 5️⃣ Issue JWT
        const token = this.jwtService.sign({
            userId: user.id,
            tenantId: tenant.id,
            role: user.role,
        });

        return {
            user: { id: user.id, email: user.email, role: user.role, tenantId: tenant.id },
            token,
        };
    }

    async inviteUser(email: string, admin: any) {
        // 1️⃣ Check if email already exists
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new BadRequestException('User already exists');

        // 2️⃣ Create invitation
        const invitation = await this.prisma.invitation.create({
            data: {
                email,
                tenantId: admin.tenantId,
                invitedBy: admin.userId, // ✅ now exists in schema
                status: 'PENDING',        // ✅ now exists in schema
            },
        });

        return invitation;
    }


    // ✅ Invited user accepts invitation
    async acceptInvite(dto: AcceptInviteDto) {
        // 1️⃣ Find invitation
        const invitation = await this.prisma.invitation.findUnique({
            where: { id: dto.invitationId },
        });

        if (!invitation || invitation.status !== 'PENDING') {
            throw new BadRequestException('Invalid or expired invitation');
        }

        // 2️⃣ Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // 3️⃣ Create user under tenant
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: 'USER',
                tenantId: invitation.tenantId,
            },
        });

        // 4️⃣ Mark invitation accepted
        await this.prisma.invitation.update({
            where: { id: dto.invitationId },
            data: { status: 'ACCEPTED' }, // ✅ safe now
        });

        // 5️⃣ Issue JWT
        const token = this.jwtService.sign({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
        });

        return { user, token };
    }

}
