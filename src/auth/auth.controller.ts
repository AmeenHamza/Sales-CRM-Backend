import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  @Post('signup-user')
  async signupUser(
    @Body() body: { email: string; password: string; tenantId: string }
  ) {
    const { email, password, tenantId } = body;
    return this.authService.signupUser(email, password, tenantId);
  }
  @UseGuards(JwtAuthGuard)
  @Post('invite')
  invite(@Body() body, @CurrentUser() user) {
    return this.authService.inviteUser(body.email, user);
  }

  // Invited user accepts invite
  @Post('accept-invite')
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto);
  }
}
