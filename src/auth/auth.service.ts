import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { success } from 'src/common/utils/response.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // =========================
  // SIGNUP → Tenant + Admin
  // =========================
  async signup(dto: SignupDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      const tenant = await this.prisma.tenant.create({
        data: { name: dto.tenantName },
      });

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });

      const token = this.jwtService.sign({
        sub: user.id,
        tenantId: tenant.id,
        role: user.role,
      });

      return success('Tenant and admin created successfully', {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: tenant.id,
        },
        token,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Signup process failed');
    }
  }

  // =========================
  // LOGIN
  // =========================
  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const passwordValid = await bcrypt.compare(
        dto.password,
        user.password,
      );

      if (!passwordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const token = this.jwtService.sign({
        sub: user.id,
        tenantId: user.tenantId,
        role: user.role,
      });

      return success('Login successful', {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
        token,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Login failed');
    }
  }

  // =========================
  // SIGNUP USER (DIRECT)
  // =========================
  async signupUser(email: string, password: string, tenantId: string) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant does not exist');
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'USER',
          tenantId: tenant.id,
        },
      });

      const token = this.jwtService.sign({
        sub: user.id,
        tenantId: user.tenantId,
        role: user.role,
      });

      return success('User created successfully', {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
        token,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('User signup failed');
    }
  }

  // =========================
  // INVITE USER
  // =========================
  async inviteUser(email: string, admin: { userId: string; tenantId: string }) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const invitation = await this.prisma.invitation.create({
        data: {
          email,
          tenantId: admin.tenantId,
          invitedBy: admin.userId,
          status: 'PENDING',
        },
      });

      return success('Invitation created successfully', invitation);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to invite user');
    }
  }

  // =========================
  // ACCEPT INVITE
  // =========================
  async acceptInvite(dto: AcceptInviteDto) {
    try {
      const invitation = await this.prisma.invitation.findUnique({
        where: { id: dto.invitationId },
      });

      if (!invitation || invitation.status !== 'PENDING') {
        throw new BadRequestException('Invalid or expired invitation');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: 'USER',
          tenantId: invitation.tenantId,
        },
      });

      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      const token = this.jwtService.sign({
        sub: user.id,
        tenantId: user.tenantId,
        role: user.role,
      });

      return success('Invitation accepted successfully', {
        user,
        token,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Accept invite failed');
    }
  }
}
