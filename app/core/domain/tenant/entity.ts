import type { WithEvents } from "@/core/domain/common/event";
import type {
  Address,
  DayOfWeek,
  PhoneNumber,
  PostalCode,
} from "@/core/domain/common/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { TenantErrorCode } from "./errorCode";
import { type TenantEvent, TenantEvents } from "./events";
import type {
  BusinessHours as BusinessHoursType,
  DailyHours,
  ReservationSettings as ReservationSettingsType,
  TemporaryHoliday as TemporaryHolidayType,
  TenantCategory as TenantCategoryType,
  TenantDescription as TenantDescriptionType,
  TenantId as TenantIdType,
  TenantName as TenantNameType,
  TenantUrlPath as TenantUrlPathType,
} from "./valueObject";
import {
  ImageUrls,
  TemporaryHoliday,
  TenantCategory,
  TenantDescription,
  TenantId,
  TenantName,
  TenantUrlPath,
} from "./valueObject";

// Tenant型定義
type TenantBase = Readonly<{
  id: TenantIdType;
  name: TenantNameType;
  category: TenantCategoryType;
  urlPath: TenantUrlPathType;
  postalCode: PostalCode;
  address: Address;
  phoneNumber: PhoneNumber;
  description: TenantDescriptionType | null;
  imageUrls: readonly string[];
  businessHours: BusinessHoursType;
  regularHolidays: readonly DayOfWeek[];
  temporaryHolidays: readonly TemporaryHolidayType[];
  reservationSettings: ReservationSettingsType;
  createdAt: Date;
  updatedAt: Date;
}>;

type ActiveTenant = TenantBase & {
  readonly status: "active";
};

type SuspendedTenant = TenantBase & {
  readonly status: "suspended";
};

type Tenant = ActiveTenant | SuspendedTenant;

export type { Tenant, ActiveTenant, SuspendedTenant };

// Tenantモジュール
export const Tenant = {
  create: (params: {
    name: string;
    category: string;
    urlPath: string;
    postalCode: PostalCode;
    address: Address;
    phoneNumber: PhoneNumber;
    description: string | null;
    imageUrls: string[];
    businessHours: BusinessHoursType;
    regularHolidays: DayOfWeek[];
    reservationSettings: ReservationSettingsType;
  }): WithEvents<ActiveTenant, TenantEvent> => {
    const now = new Date();
    const tenant: ActiveTenant = {
      id: TenantId.generate(),
      name: TenantName.create(params.name),
      category: TenantCategory.create(params.category),
      urlPath: TenantUrlPath.create(params.urlPath),
      postalCode: params.postalCode,
      address: params.address,
      phoneNumber: params.phoneNumber,
      description:
        params.description !== null
          ? TenantDescription.create(params.description)
          : null,
      imageUrls: ImageUrls.validate([...params.imageUrls]),
      businessHours: params.businessHours,
      regularHolidays: [...params.regularHolidays],
      temporaryHolidays: [],
      reservationSettings: params.reservationSettings,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: tenant,
      events: [TenantEvents.created(tenant.id)],
    };
  },

  updateProfile: (
    tenant: Tenant,
    params: {
      name: string;
      category: string;
      postalCode: PostalCode;
      address: Address;
      phoneNumber: PhoneNumber;
      description: string | null;
      imageUrls: string[];
    },
  ): WithEvents<Tenant, TenantEvent> => {
    return {
      entity: {
        ...tenant,
        name: TenantName.create(params.name),
        category: TenantCategory.create(params.category),
        postalCode: params.postalCode,
        address: params.address,
        phoneNumber: params.phoneNumber,
        description:
          params.description !== null
            ? TenantDescription.create(params.description)
            : null,
        imageUrls: ImageUrls.validate([...params.imageUrls]),
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  updateBusinessHours: (
    tenant: Tenant,
    businessHours: BusinessHoursType,
  ): WithEvents<Tenant, TenantEvent> => {
    return {
      entity: {
        ...tenant,
        businessHours,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  updateRegularHolidays: (
    tenant: Tenant,
    holidays: DayOfWeek[],
  ): WithEvents<Tenant, TenantEvent> => {
    return {
      entity: {
        ...tenant,
        regularHolidays: [...holidays],
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  addTemporaryHoliday: (
    tenant: Tenant,
    holiday: { date: Date; reason: string | null },
  ): WithEvents<Tenant, TenantEvent> => {
    const exists = tenant.temporaryHolidays.some(
      (h) => h.date.getTime() === holiday.date.getTime(),
    );
    if (exists) {
      throw new BusinessRuleError(
        TenantErrorCode.DuplicateTemporaryHoliday,
        "Temporary holiday already exists for this date",
      );
    }

    const newHoliday = TemporaryHoliday.create(holiday);

    return {
      entity: {
        ...tenant,
        temporaryHolidays: [...tenant.temporaryHolidays, newHoliday],
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  removeTemporaryHoliday: (
    tenant: Tenant,
    date: Date,
  ): WithEvents<Tenant, TenantEvent> => {
    const index = tenant.temporaryHolidays.findIndex(
      (h) => h.date.getTime() === date.getTime(),
    );
    if (index === -1) {
      throw new BusinessRuleError(
        TenantErrorCode.TemporaryHolidayNotFound,
        "Temporary holiday not found for this date",
      );
    }

    const updatedHolidays = tenant.temporaryHolidays.filter(
      (h) => h.date.getTime() !== date.getTime(),
    );

    return {
      entity: {
        ...tenant,
        temporaryHolidays: updatedHolidays,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  updateReservationSettings: (
    tenant: Tenant,
    settings: ReservationSettingsType,
  ): WithEvents<Tenant, TenantEvent> => {
    return {
      entity: {
        ...tenant,
        reservationSettings: settings,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  suspend: (tenant: ActiveTenant): WithEvents<SuspendedTenant, TenantEvent> => {
    return {
      entity: {
        ...tenant,
        status: "suspended",
        updatedAt: new Date(),
      },
      events: [TenantEvents.suspended(tenant.id)],
    };
  },

  reactivate: (
    tenant: SuspendedTenant,
  ): WithEvents<ActiveTenant, TenantEvent> => {
    return {
      entity: {
        ...tenant,
        status: "active",
        updatedAt: new Date(),
      },
      events: [TenantEvents.reactivated(tenant.id)],
    };
  },

  isOperatingOn: (tenant: Tenant, date: Date): boolean => {
    // Check temporary holidays first
    const isTemporaryHoliday = tenant.temporaryHolidays.some(
      (h) =>
        h.date.getFullYear() === date.getFullYear() &&
        h.date.getMonth() === date.getMonth() &&
        h.date.getDate() === date.getDate(),
    );
    if (isTemporaryHoliday) {
      return false;
    }

    // Check regular holidays
    const dayOfWeek = date.getDay() as DayOfWeek;
    if (tenant.regularHolidays.includes(dayOfWeek)) {
      return false;
    }

    // Check if business hours are set for this day
    const dailyHours = tenant.businessHours[dayOfWeek];
    return dailyHours !== null;
  },

  getOperatingHoursOn: (tenant: Tenant, date: Date): DailyHours => {
    if (!Tenant.isOperatingOn(tenant, date)) {
      return null;
    }

    const dayOfWeek = date.getDay() as DayOfWeek;
    return tenant.businessHours[dayOfWeek];
  },

  // 型ガード
  isActive: (tenant: Tenant): tenant is ActiveTenant =>
    tenant.status === "active",
  isSuspended: (tenant: Tenant): tenant is SuspendedTenant =>
    tenant.status === "suspended",
};
