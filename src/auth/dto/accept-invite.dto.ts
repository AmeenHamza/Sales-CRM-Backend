import { IsEmail, IsString, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  invitationId: string;
}
