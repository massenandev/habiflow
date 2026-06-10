import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HabitService } from "../application/habit.service";
import { CreateHabitDto, DeviceDto, UpdateHabitDto } from "./dto/habit.dto";

@ApiTags("habits")
@Controller("habits")
export class HabitsController {
  constructor(private readonly habits: HabitService) {}

  @Get()
  @ApiOperation({ summary: "List active habits for a device and date range" })
  @ApiQuery({ name: "deviceId", example: "device-1749550000000-abcd1234" })
  @ApiQuery({ name: "from", example: "2026-06-08" })
  @ApiQuery({ name: "to", example: "2026-06-10" })
  @ApiResponse({ status: 200, description: "Active habits with visible completions and streaks." })
  list(@Query("deviceId") deviceId: string, @Query("from") from: string, @Query("to") to: string) {
    return this.habits.listActive(deviceId, from, to);
  }

  @Post()
  @ApiOperation({ summary: "Create a habit" })
  @ApiBody({ type: CreateHabitDto })
  @ApiResponse({ status: 201, description: "Created habit." })
  create(@Body() body: CreateHabitDto) {
    return this.habits.create(body);
  }

  @Patch(":habitId")
  @ApiOperation({ summary: "Edit a habit" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiBody({ type: UpdateHabitDto })
  @ApiResponse({ status: 200, description: "Updated habit." })
  update(@Param("habitId") habitId: string, @Body() body: UpdateHabitDto) {
    const { deviceId, ...changes } = body;
    return this.habits.update(habitId, deviceId, changes);
  }

  @Post(":habitId/archive")
  @ApiOperation({ summary: "Archive a habit" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiBody({ type: DeviceDto })
  @ApiResponse({ status: 200, description: "Archived habit." })
  archive(@Param("habitId") habitId: string, @Body() body: DeviceDto) {
    return this.habits.archive(habitId, body.deviceId);
  }

  @Delete(":habitId")
  @ApiOperation({ summary: "Delete a habit and its completions" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiBody({ type: DeviceDto })
  @ApiResponse({ status: 200, description: "Deleted habit." })
  delete(@Param("habitId") habitId: string, @Body() body: DeviceDto) {
    return this.habits.delete(habitId, body.deviceId);
  }

  @Post(":habitId/toggle")
  @ApiOperation({ summary: "Toggle today's completion for a habit" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiBody({ type: DeviceDto })
  @ApiResponse({ status: 201, description: "Habit with updated completion state." })
  toggle(@Param("habitId") habitId: string, @Body() body: DeviceDto) {
    return this.habits.toggleToday(habitId, body.deviceId);
  }

  @Get(":habitId/history")
  @ApiOperation({ summary: "Get habit completion history" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiQuery({ name: "deviceId", example: "device-1749550000000-abcd1234" })
  @ApiQuery({ name: "from", example: "2026-06-01" })
  @ApiQuery({ name: "to", example: "2026-06-30" })
  @ApiResponse({ status: 200, description: "Completion records for the date range." })
  history(@Param("habitId") habitId: string, @Query("deviceId") deviceId: string, @Query("from") from: string, @Query("to") to: string) {
    return this.habits.history(habitId, deviceId, from, to);
  }

  @Get(":habitId/streak")
  @ApiOperation({ summary: "Get current and best streak for a habit" })
  @ApiParam({ name: "habitId", description: "Habit UUID" })
  @ApiQuery({ name: "deviceId", example: "device-1749550000000-abcd1234" })
  @ApiResponse({ status: 200, description: "Current and best streak." })
  streak(@Param("habitId") habitId: string, @Query("deviceId") deviceId: string) {
    return this.habits.streak(habitId, deviceId);
  }
}
