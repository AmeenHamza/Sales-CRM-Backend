import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  tenantName: string; // new tenant name
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(6)
  password: string;
}
