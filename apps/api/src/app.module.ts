import { Module } from "@nestjs/common";
import { HabitService } from "./application/habit.service";
import { HABIT_REPOSITORY } from "./application/ports/habit-repository";
import { PrismaHabitRepository } from "./infrastructure/prisma-habit.repository";
import { PrismaService } from "./infrastructure/prisma.service";
import { HabitsController } from "./presentation/habits.controller";
import { HealthController } from "./presentation/health.controller";

@Module({
  controllers: [HabitsController, HealthController],
  providers: [
    HabitService,
    PrismaService,
    PrismaHabitRepository,
    {
      provide: HABIT_REPOSITORY,
      useExisting: PrismaHabitRepository
    }
  ]
})
export class AppModule {}
