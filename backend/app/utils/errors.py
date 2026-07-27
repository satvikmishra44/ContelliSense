class DomainError(Exception):
    """Base class for domain-specific errors."""


class ChannelNotFoundError(DomainError):
    """Raised when a channel cannot be resolved or fetched."""