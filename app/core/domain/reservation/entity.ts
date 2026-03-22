import type { WithEvents } from "@/core/domain/common/event";
import type { TimeOfDay } from "@/core/domain/common/valueObject";
import type { CustomerId } from "@/core/domain/customer/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import type { MenuId } from "@/core/domain/menu/valueObject";
import type { StaffProfileId } from "@/core/domain/staff/valueObject";
import type {
  ApprovalMethod,
  ReservationSettings,
  TenantId,
} from "@/core/domain/tenant/valueObject";
import { ReservationErrorCode } from "./errorCode";
import { type ReservationEvent, ReservationEvents } from "./events";
import type {
  CreatedBy,
  ReservationId as ReservationIdType,
  ReservationStatus as ReservationStatusType,
} from "./valueObject";
import { ReservationId } from "./valueObject";

type Reservation = Readonly<{
  id: ReservationIdType;
  tenantId: TenantId;
  customerId: CustomerId | null;
  menuId: MenuId;
  staffProfileId: StaffProfileId | null;
  date: Date;
  startTime: TimeOfDay;
  endTime: TimeOfDay;
  status: ReservationStatusType;
  menuName: string;
  menuDuration: number;
  menuPrice: number;
  staffName: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhoneNumber: string | null;
  note: string | null;
  cancellationReason: string | null;
  rejectionReason: string | null;
  createdBy: CreatedBy;
  createdAt: Date;
  updatedAt: Date;
}>;

export type { Reservation };

export const Reservation = {
  create: (params: {
    tenantId: TenantId;
    customerId: CustomerId | null;
    menuId: MenuId;
    staffProfileId: StaffProfileId | null;
    date: Date;
    startTime: TimeOfDay;
    endTime: TimeOfDay;
    menuName: string;
    menuDuration: number;
    menuPrice: number;
    staffName: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhoneNumber: string | null;
    note: string | null;
    createdBy: CreatedBy;
    approvalMethod: ApprovalMethod;
  }): WithEvents<Reservation, ReservationEvent> => {
    const now = new Date();
    const status: ReservationStatusType =
      params.approvalMethod === "auto" ? "confirmed" : "pending";

    const reservation: Reservation = {
      id: ReservationId.generate(),
      tenantId: params.tenantId,
      customerId: params.customerId,
      menuId: params.menuId,
      staffProfileId: params.staffProfileId,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      status,
      menuName: params.menuName,
      menuDuration: params.menuDuration,
      menuPrice: params.menuPrice,
      staffName: params.staffName,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhoneNumber: params.customerPhoneNumber,
      note: params.note,
      cancellationReason: null,
      rejectionReason: null,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: reservation,
      events: [
        ReservationEvents.created(
          reservation.id,
          reservation.tenantId,
          reservation.customerId,
          reservation.status,
        ),
      ],
    };
  },

  approve: (
    reservation: Reservation,
  ): WithEvents<Reservation, ReservationEvent> => {
    if (reservation.status !== "pending") {
      throw new BusinessRuleError(
        ReservationErrorCode.CannotApprove,
        "Only pending reservations can be approved",
      );
    }

    const updated: Reservation = {
      ...reservation,
      status: "confirmed",
      updatedAt: new Date(),
    };

    return {
      entity: updated,
      events: [
        ReservationEvents.approved(
          updated.id,
          updated.tenantId,
          updated.customerId,
        ),
      ],
    };
  },

  reject: (
    reservation: Reservation,
    reason: string | null,
  ): WithEvents<Reservation, ReservationEvent> => {
    if (reservation.status !== "pending") {
      throw new BusinessRuleError(
        ReservationErrorCode.CannotReject,
        "Only pending reservations can be rejected",
      );
    }

    const updated: Reservation = {
      ...reservation,
      status: "rejected",
      rejectionReason: reason,
      updatedAt: new Date(),
    };

    return {
      entity: updated,
      events: [
        ReservationEvents.rejected(
          updated.id,
          updated.tenantId,
          updated.customerId,
          reason,
        ),
      ],
    };
  },

  cancel: (
    reservation: Reservation,
    reason: string | null,
  ): WithEvents<Reservation, ReservationEvent> => {
    if (
      reservation.status !== "confirmed" &&
      reservation.status !== "pending"
    ) {
      throw new BusinessRuleError(
        ReservationErrorCode.CannotCancel,
        "Only confirmed or pending reservations can be cancelled",
      );
    }

    const updated: Reservation = {
      ...reservation,
      status: "cancelled",
      cancellationReason: reason,
      updatedAt: new Date(),
    };

    return {
      entity: updated,
      events: [
        ReservationEvents.cancelled(
          updated.id,
          updated.tenantId,
          updated.customerId,
          updated.createdBy,
          reason,
        ),
      ],
    };
  },

  complete: (
    reservation: Reservation,
  ): WithEvents<Reservation, ReservationEvent> => {
    if (reservation.status !== "confirmed") {
      throw new BusinessRuleError(
        ReservationErrorCode.InvalidStatus,
        "Only confirmed reservations can be completed",
      );
    }

    const updated: Reservation = {
      ...reservation,
      status: "completed",
      updatedAt: new Date(),
    };

    return {
      entity: updated,
      events: [ReservationEvents.completed(updated.id, updated.tenantId)],
    };
  },

  update: (
    reservation: Reservation,
    params: {
      staffProfileId?: StaffProfileId | null;
      date?: Date;
      startTime?: TimeOfDay;
      endTime?: TimeOfDay;
      staffName?: string | null;
      customerName?: string | null;
      customerEmail?: string | null;
      customerPhoneNumber?: string | null;
      note?: string | null;
    },
  ): WithEvents<Reservation, ReservationEvent> => {
    if (
      reservation.status !== "confirmed" &&
      reservation.status !== "pending"
    ) {
      throw new BusinessRuleError(
        ReservationErrorCode.CannotModify,
        "Only confirmed or pending reservations can be modified",
      );
    }

    const updated: Reservation = {
      ...reservation,
      staffProfileId:
        params.staffProfileId !== undefined
          ? params.staffProfileId
          : reservation.staffProfileId,
      date: params.date !== undefined ? params.date : reservation.date,
      startTime:
        params.startTime !== undefined
          ? params.startTime
          : reservation.startTime,
      endTime:
        params.endTime !== undefined ? params.endTime : reservation.endTime,
      staffName:
        params.staffName !== undefined
          ? params.staffName
          : reservation.staffName,
      customerName:
        params.customerName !== undefined
          ? params.customerName
          : reservation.customerName,
      customerEmail:
        params.customerEmail !== undefined
          ? params.customerEmail
          : reservation.customerEmail,
      customerPhoneNumber:
        params.customerPhoneNumber !== undefined
          ? params.customerPhoneNumber
          : reservation.customerPhoneNumber,
      note: params.note !== undefined ? params.note : reservation.note,
      updatedAt: new Date(),
    };

    return {
      entity: updated,
      events: [
        ReservationEvents.updated(
          updated.id,
          updated.tenantId,
          updated.customerId,
        ),
      ],
    };
  },

  canCancel: (
    reservation: Reservation,
    settings: ReservationSettings,
    now: Date,
  ): boolean => {
    if (
      reservation.status !== "confirmed" &&
      reservation.status !== "pending"
    ) {
      return false;
    }

    const reservationDateTime = new Date(reservation.date);
    const [hours, minutes] = reservation.startTime.split(":").map(Number);
    reservationDateTime.setHours(hours, minutes, 0, 0);

    const deadlineMs = settings.cancellationDeadlineHours * 60 * 60 * 1000;
    const deadline = new Date(reservationDateTime.getTime() - deadlineMs);

    return now <= deadline;
  },

  canModify: (
    reservation: Reservation,
    settings: ReservationSettings,
    now: Date,
  ): boolean => {
    if (
      reservation.status !== "confirmed" &&
      reservation.status !== "pending"
    ) {
      return false;
    }

    const reservationDateTime = new Date(reservation.date);
    const [hours, minutes] = reservation.startTime.split(":").map(Number);
    reservationDateTime.setHours(hours, minutes, 0, 0);

    const deadlineMs = settings.cancellationDeadlineHours * 60 * 60 * 1000;
    const deadline = new Date(reservationDateTime.getTime() - deadlineMs);

    return now <= deadline;
  },
};
