import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "../application/auth.service";
import { HabitService } from "../application/habit.service";
import { AuthenticatedRequest } from "./auth.guard";
import { CreateHabitDto, DeviceDto, ToggleHabitDto, UpdateHabitDto } from "./dto/habit.dto";

@ApiTags("habits")
@Controller("habits")
export class HabitsController {
  constructor(
    private readonly habits: HabitService,
    private readonly auth: AuthService
  ) {}

  @Get()
  @ApiOperation({ summary: "List active habits for a device and date range" })
  @ApiQuery({ name: "deviceId", example: "device-1749550000000-abcd1234" })
  @ApiQuery({ name: "from", example: "2026-06-08" })
  @ApiQuery({ name: "to", example: "2026-06-10" })
  @ApiResponse({ status: 200, description: "Active habits with visible completions and streaks." })
  list(@Req() request: AuthenticatedRequest, @Query("deviceId") deviceId: string, @Query("from") from: string, @Query("to") to: string) {
    return this.habits.listActive(this.ownerFrom(request, deviceId), from, to);
  }

  @Post()
  @ApiOperation({ summary: "Create a habit" })
  @ApiBody({ type: CreateHabitDto })
  @ApiResponse({ status: 201, description: "Created habit." })
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateHabitDto) {
    const owner = this.ownerFrom(request, body.deviceId);
    return this.habits.create(body, owner.userId);
  }

  @Patch(":habitId")
  @ApiOperation({ summary: "Edit a habit" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiBody({ type: UpdateHabitDto })
  @ApiResponse({ status: 200, description: "Updated habit." })
  update(@Req() request: AuthenticatedRequest, @Param("habitId") habitId: string, @Body() body: UpdateHabitDto) {
    const { deviceId, ...changes } = body;
    return this.habits.update(habitId, this.ownerFrom(request, deviceId), changes);
  }

  @Post(":habitId/archive")
  @ApiOperation({ summary: "Archive a habit" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiBody({ type: DeviceDto })
  @ApiResponse({ status: 200, description: "Archived habit." })
  archive(@Req() request: AuthenticatedRequest, @Param("habitId") habitId: string, @Body() body: DeviceDto) {
    return this.habits.archive(habitId, this.ownerFrom(request, body.deviceId));
  }

  @Delete(":habitId")
  @ApiOperation({ summary: "Delete a habit and its completions" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiBody({ type: DeviceDto })
  @ApiResponse({ status: 200, description: "Deleted habit." })
  delete(@Req() request: AuthenticatedRequest, @Param("habitId") habitId: string, @Body() body: DeviceDto) {
    return this.habits.delete(habitId, this.ownerFrom(request, body.deviceId));
  }

  @Post(":habitId/toggle")
  @ApiOperation({ summary: "Toggle completion for a habit on a present or past date" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiBody({ type: ToggleHabitDto })
  @ApiResponse({ status: 201, description: "Habit with updated completion state." })
  toggle(@Req() request: AuthenticatedRequest, @Param("habitId") habitId: string, @Body() body: ToggleHabitDto) {
    return this.habits.toggleDate(habitId, this.ownerFrom(request, body.deviceId), body.date);
  }

  @Get(":habitId/history")
  @ApiOperation({ summary: "Get habit completion history" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiQuery({ name: "deviceId", example: "device-1749550000000-abcd1234" })
  @ApiQuery({ name: "from", example: "2026-06-01" })
  @ApiQuery({ name: "to", example: "2026-06-30" })
  @ApiResponse({ status: 200, description: "Completion records for the date range." })
  history(@Req() request: AuthenticatedRequest, @Param("habitId") habitId: string, @Query("deviceId") deviceId: string, @Query("from") from: string, @Query("to") to: string) {
    return this.habits.history(habitId, this.ownerFrom(request, deviceId), from, to);
  }

  @Get(":habitId/streak")
  @ApiOperation({ summary: "Get current and best streak for a habit" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiQuery({ name: "deviceId", example: "device-1749550000000-abcd1234" })
  @ApiResponse({ status: 200, description: "Current and best streak." })
  streak(@Req() request: AuthenticatedRequest, @Param("habitId") habitId: string, @Query("deviceId") deviceId: string) {
    return this.habits.streak(habitId, this.ownerFrom(request, deviceId));
  }

  private ownerFrom(request: AuthenticatedRequest, deviceId: string) {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    return token ? { deviceId, userId: this.auth.verifyAccessToken(token).sub } : { deviceId };
  }
}
