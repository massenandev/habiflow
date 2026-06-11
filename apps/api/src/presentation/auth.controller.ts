import { Body, Controller, Delete, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "../application/auth.service";
import { AuthenticatedRequest, AuthGuard } from "./auth.guard";
import { ClaimGuestDataDto, ForgotPasswordDto, LoginDto, RefreshDto, ResetPasswordDto, SignupDto, SocialLoginDto } from "./dto/auth.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  @ApiOperation({ summary: "Create an email/password account" })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ status: 201, description: "Created account and session." })
  signup(@Body() body: SignupDto) {
    return this.auth.signup(body.email, body.password, body.displayName);
  }

  @Post("login")
  @ApiOperation({ summary: "Log in with email and password" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: "Created session." })
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @Post("social")
  @ApiOperation({ summary: "Log in or sign up with a social identity token" })
  @ApiBody({ type: SocialLoginDto })
  @ApiResponse({ status: 201, description: "Created session." })
  social(@Body() body: SocialLoginDto) {
    return this.auth.social(body.provider, body.idToken);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Rotate a refresh token and issue a new session" })
  @ApiBody({ type: RefreshDto })
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post("logout")
  @ApiOperation({ summary: "Revoke a refresh token" })
  @ApiBody({ type: RefreshDto })
  async logout(@Body() body: RefreshDto) {
    await this.auth.logout(body.refreshToken);
    return { ok: true };
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request a password reset token" })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.auth.forgotPassword(body.email);
    return { ok: true };
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password with a token" })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.auth.resetPassword(body.token, body.password);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current authenticated user" })
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.me(request.user!.id);
  }

  @Delete("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Hard delete the current account and owned data" })
  async deleteMe(@Req() request: AuthenticatedRequest) {
    await this.auth.deleteAccount(request.user!.id);
    return { ok: true };
  }

  @Post("claim-guest-data")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Assign anonymous device habits to the current user" })
  @ApiBody({ type: ClaimGuestDataDto })
  claimGuestData(@Req() request: AuthenticatedRequest, @Body() body: ClaimGuestDataDto) {
    return this.auth.claimGuestData(request.user!.id, body.deviceId);
  }
}
