class AppError(Exception):
    status_code = 400
    code = "app_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class EventNotFound(AppError):
    status_code = 404
    code = "event_not_found"


class BookingNotFound(AppError):
    status_code = 404
    code = "booking_not_found"


class InsufficientCapacity(AppError):
    status_code = 409
    code = "insufficient_capacity"


class BookingRuleViolation(AppError):
    status_code = 422
    code = "booking_rule_violation"
