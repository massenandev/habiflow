import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsHexColor, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min, ValidateNested } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class GoalDto {
  @ApiProperty({ enum: ["none", "daily", "week", "month"], example: "daily" })
  @IsIn(["none", "daily", "week", "month"])
  streakGoal!: "none" | "daily" | "week" | "month";

  @ApiProperty({ example: 1, minimum: 1, maximum: 12, description: "How many completions are needed per day." })
  @IsInt()
  @Min(1)
  @Max(12)
  completionsPerDay!: number;
}

export class ReminderDto {
  @ApiProperty({ example: 0, minimum: 0, maximum: 12, description: "How many reminders are active for this habit." })
  @IsInt()
  @Min(0)
  @Max(12)
  count!: number;

  @ApiProperty({ type: [String], example: [], description: "24-hour HH:mm times. Length must match count when count is greater than zero." })
  @IsArray()
  @ArrayMaxSize(12)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { each: true })
  times!: string[];
}

export class CreateHabitDto {
  @ApiProperty({ example: "device-1749550000000-abcd1234" })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiProperty({ example: "Drink water" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: "💧", description: "Optional habit emoji. Defaults to ✅ when omitted." })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiProperty({ example: "#0F766E" })
  @IsHexColor()
  color!: string;

  @ApiProperty({ type: GoalDto })
  @ValidateNested()
  @Type(() => GoalDto)
  goal!: GoalDto;

  @ApiProperty({ type: ReminderDto })
  @ValidateNested()
  @Type(() => ReminderDto)
  reminder!: ReminderDto;
}

export class UpdateHabitDto {
  @ApiProperty({ example: "device-1749550000000-abcd1234" })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiPropertyOptional({ example: "Read 10 pages" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: "📚" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  emoji?: string;

  @ApiPropertyOptional({ example: "#7C3AED" })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ type: GoalDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GoalDto)
  goal?: GoalDto;

  @ApiPropertyOptional({ type: ReminderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReminderDto)
  reminder?: ReminderDto;
}

export class DeviceDto {
  @ApiProperty({ example: "device-1749550000000-abcd1234" })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}

export class ToggleHabitDto extends DeviceDto {
  @ApiProperty({ example: "2026-06-10", description: "Completion date to toggle. Present and past dates are allowed." })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}
