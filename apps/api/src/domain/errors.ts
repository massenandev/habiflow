export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {}

export class HabitNotFoundError extends DomainError {}

export class UnauthorizedDeviceError extends DomainError {}

export class PersistenceError extends DomainError {}
