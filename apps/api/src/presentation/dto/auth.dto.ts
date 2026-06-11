import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class SignupDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: "password123" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: "Massenan" })
  @IsOptional()
  @IsString()
  displayName?: string;
}

export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SocialLoginDto {
  @ApiProperty({ enum: ["google", "apple"] })
  @IsIn(["google", "apple"])
  provider!: "google" | "apple";

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class ClaimGuestDataDto {
  @ApiProperty({ example: "device-1749550000000-abcd1234" })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}
