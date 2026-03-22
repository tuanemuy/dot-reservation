import {
  Address,
  Email,
  PhoneNumber,
  PostalCode,
} from "@/core/domain/common/valueObject";
import { Member } from "@/core/domain/member/entity";
import { MemberRole } from "@/core/domain/member/valueObject";
import { Tenant } from "@/core/domain/tenant/entity";
import {
  BusinessHours,
  ReservationSettings,
} from "@/core/domain/tenant/valueObject";
import { ConflictError, ConflictErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type CreateTenantInput = {
  authUserId: string;
  name: string;
  category: string;
  urlPath: string;
  postalCode: string;
  address: { prefecture: string; city: string; street: string };
  phoneNumber: string;
  creatorName: string;
  creatorEmail: string;
};

export type CreateTenantOutput = {
  id: string;
  name: string;
  urlPath: string;
};

export async function createTenant({
  container,
  input,
}: ServiceArgs<CreateTenantInput>): Promise<CreateTenantOutput> {
  const postalCode = PostalCode.create(input.postalCode);
  const address = Address.create(input.address);
  const phoneNumber = PhoneNumber.create(input.phoneNumber);
  const creatorEmail = Email.create(input.creatorEmail);

  const defaultBusinessHours = BusinessHours.create({
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });

  const defaultReservationSettings = ReservationSettings.create({
    bookingWindowDays: 30,
    bookingDeadlineHours: 24,
    cancellationDeadlineHours: 24,
    slotDurationMinutes: 30,
    bufferMinutes: 0,
    approvalMethod: "manual",
  });

  const { entity: tenant, events: tenantEvents } = Tenant.create({
    name: input.name,
    category: input.category,
    urlPath: input.urlPath,
    postalCode,
    address,
    phoneNumber,
    description: null,
    imageUrls: [],
    businessHours: defaultBusinessHours,
    regularHolidays: [],
    reservationSettings: defaultReservationSettings,
  });

  const { entity: member, events: memberEvents } = Member.create({
    tenantId: tenant.id,
    authUserId: input.authUserId,
    name: input.creatorName,
    email: creatorEmail,
    phoneNumber: null,
    role: MemberRole.create("admin"),
  });

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const urlPathExists = await repositories.tenantRepository.existsByUrlPath(
      tenant.urlPath,
    );
    if (urlPathExists) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "URL path is already in use",
      );
    }

    await repositories.tenantRepository.save(tenant);
    await repositories.memberRepository.save(member);
    await repositories.outboxRepository.saveEvents([
      ...tenantEvents,
      ...memberEvents,
    ]);
  });

  return {
    id: tenant.id,
    name: tenant.name,
    urlPath: tenant.urlPath,
  };
}
