import type { WithEvents } from "@/core/domain/common/event";
import type { Email, PhoneNumber } from "@/core/domain/common/valueObject";
import { type CustomerEvent, CustomerEvents } from "./events";
import { CustomerDisplayName, CustomerId } from "./valueObject";

type CustomerBase = Readonly<{
  id: CustomerId;
  authUserId: string;
  displayName: CustomerDisplayName;
  email: Email;
  phoneNumber: PhoneNumber | null;
  createdAt: Date;
  updatedAt: Date;
}>;

type ActiveCustomer = CustomerBase & {
  readonly status: "active";
};

type SuspendedCustomer = CustomerBase & {
  readonly status: "suspended";
};

type Customer = ActiveCustomer | SuspendedCustomer;

const Customer = {
  create: (params: {
    authUserId: string;
    displayName: string;
    email: Email;
    phoneNumber: PhoneNumber | null;
  }): WithEvents<ActiveCustomer, CustomerEvent> => {
    const now = new Date();
    const customer: ActiveCustomer = {
      id: CustomerId.generate(),
      authUserId: params.authUserId,
      displayName: CustomerDisplayName.create(params.displayName),
      email: params.email,
      phoneNumber: params.phoneNumber,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: customer,
      events: [CustomerEvents.created(customer.id)],
    };
  },

  updateProfile: (
    customer: Customer,
    params: {
      displayName?: string;
      email?: Email;
      phoneNumber?: PhoneNumber | null;
    },
  ): WithEvents<Customer, CustomerEvent> => {
    return {
      entity: {
        ...customer,
        displayName:
          params.displayName !== undefined
            ? CustomerDisplayName.create(params.displayName)
            : customer.displayName,
        email: params.email !== undefined ? params.email : customer.email,
        phoneNumber:
          params.phoneNumber !== undefined
            ? params.phoneNumber
            : customer.phoneNumber,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  suspend: (
    customer: ActiveCustomer,
  ): WithEvents<SuspendedCustomer, CustomerEvent> => {
    return {
      entity: {
        ...customer,
        status: "suspended",
        updatedAt: new Date(),
      },
      events: [CustomerEvents.suspended(customer.id)],
    };
  },

  reactivate: (
    customer: SuspendedCustomer,
  ): WithEvents<ActiveCustomer, CustomerEvent> => {
    return {
      entity: {
        ...customer,
        status: "active",
        updatedAt: new Date(),
      },
      events: [CustomerEvents.reactivated(customer.id)],
    };
  },

  isActive: (customer: Customer): customer is ActiveCustomer =>
    customer.status === "active",
};

export { Customer };
export type { ActiveCustomer, SuspendedCustomer };
