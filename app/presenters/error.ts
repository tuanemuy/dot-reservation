import {
  type ConflictError,
  type ForbiddenError,
  isConflictError,
  isForbiddenError,
  isNotFoundError,
  isSystemError,
  isUnauthenticatedError,
  isValidationError,
  type NotFoundError,
  NotFoundErrorCode,
  type SystemError,
  SystemErrorCode,
  type UnauthenticatedError,
  UnauthenticatedErrorCode,
  type ValidationError,
} from "@/core/application/error";
import {
  type BusinessRuleError,
  isBusinessRuleError,
} from "@/core/domain/error";
import { NoteErrorCode } from "@/core/domain/note/errorCode";
import { SettingsErrorCode } from "@/core/domain/settings/errorCode";
import { TagErrorCode } from "@/core/domain/tag/errorCode";
import { isError } from "@/lib/error";

export function formatBusinessRuleError(error: BusinessRuleError): string {
  switch (error.code) {
    case NoteErrorCode.NoteContentInvalid:
      return "Note content must be a valid JSON structure.";
    case NoteErrorCode.NoteTextEmpty:
      return "Note text cannot be empty.";
    case NoteErrorCode.NoteTextTooLong:
      return "Note text exceeds the maximum allowed length.";
    case NoteErrorCode.NoteInvalidSortOrder:
      return "Invalid sort order specified.";
    case NoteErrorCode.NoteInvalidOrderBy:
      return "Invalid order by field specified.";
    case TagErrorCode.TagNameEmpty:
      return "Tag name cannot be empty.";
    case TagErrorCode.TagNameTooLong:
      return "Tag name exceeds the maximum allowed length.";
    case TagErrorCode.TagNameInvalidCharacter:
      return "Tag name contains invalid characters.";
    case SettingsErrorCode.SettingsInvalidSortOrder:
      return "Invalid sort order in settings.";
    case SettingsErrorCode.SettingsInvalidOrderBy:
      return "Invalid order by field in settings.";
    case SettingsErrorCode.SettingsAutoSaveIntervalTooShort:
      return "Auto-save interval is too short.";
    case SettingsErrorCode.SettingsAutoSaveIntervalTooLong:
      return "Auto-save interval is too long.";
    default:
      return error.code satisfies never;
  }
}

export function formatNotFoundError(error: NotFoundError): string {
  switch (error.code) {
    case NotFoundErrorCode.NoteNotFound:
      return "The requested note was not found.";
    case NotFoundErrorCode.TagNotFound:
      return "The requested tag was not found.";
    case NotFoundErrorCode.NotFound:
      return "The requested resource was not found.";
    default:
      return error.code satisfies never;
  }
}

export function formatConflictError(_error: ConflictError): string {
  return "A conflict occurred while processing your request.";
}

export function formatUnauthenticatedError(
  error: UnauthenticatedError,
): string {
  switch (error.code) {
    case UnauthenticatedErrorCode.AuthenticationRequired:
      return "Authentication is required to access this resource.";
    case UnauthenticatedErrorCode.TokenExpired:
      return "Your session has expired. Please log in again.";
    case UnauthenticatedErrorCode.InvalidToken:
      return "Invalid authentication token.";
    default:
      return error.code satisfies never;
  }
}

export function formatForbiddenError(_error: ForbiddenError): string {
  return "You do not have permission to access this resource.";
}

export function formatValidationError(_error: ValidationError): string {
  return "Invalid input. Please check your data and try again.";
}

export function formatSystemError(error: SystemError): string {
  switch (error.code) {
    case SystemErrorCode.InternalServerError:
      return "An internal server error occurred.";
    case SystemErrorCode.DatabaseError:
      return "A database error occurred.";
    case SystemErrorCode.NetworkError:
      return "A network error occurred.";
    case SystemErrorCode.ExportError:
      return "An error occurred while exporting data.";
    case SystemErrorCode.StorageError:
      return "A storage error occurred.";
    case SystemErrorCode.TagExtractionError:
      return "An error occurred while extracting tags.";
    default:
      return error.code satisfies never;
  }
}

export function formatError(error: unknown): string {
  if (isBusinessRuleError(error)) {
    return formatBusinessRuleError(error);
  }

  if (isNotFoundError(error)) {
    return formatNotFoundError(error);
  }

  if (isConflictError(error)) {
    return formatConflictError(error);
  }

  if (isUnauthenticatedError(error)) {
    return formatUnauthenticatedError(error);
  }

  if (isForbiddenError(error)) {
    return formatForbiddenError(error);
  }

  if (isValidationError(error)) {
    return formatValidationError(error);
  }

  if (isSystemError(error)) {
    return formatSystemError(error);
  }

  if (isError(error)) {
    return error.message;
  }

  return "An unknown error occurred.";
}
