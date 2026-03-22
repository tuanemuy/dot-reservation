import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import type { ShiftRequestDetail } from "@/core/application/shift/listShiftRequests";
import { listShiftRequests } from "@/core/application/shift/listShiftRequests";
import { submitShiftRequests } from "@/core/application/shift/submitShiftRequests";
import { listStaffProfiles } from "@/core/application/staff/listStaffProfiles";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/shift-requests";

function getNextWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  // Start of next week (Monday)
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((8 - day) % 7 || 7));
  // End of next week (Sunday)
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  return {
    start: formatDate(nextMonday),
    end: formatDate(nextSunday),
  };
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateStr: string): string {
  const [_year, month, dayStr] = dateStr.split("-");
  const m = Number.parseInt(month);
  const d = Number.parseInt(dayStr);
  const date = new Date(Number.parseInt(dateStr.split("-")[0]), m - 1, d);
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  return `${m}/${d}(${dayNames[date.getDay()]})`;
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const startParts = start.split("-").map(Number);
  const endParts = end.split("-").map(Number);
  const current = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  while (current <= endDate) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

const submitSchema = z.object({
  staffProfileId: z.string().min(1),
  tenantId: z.string().min(1),
  requestsJson: z.string().min(1),
});

const handlers = {
  submitShiftRequests: defineHandler({
    schema: submitSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      const requests = JSON.parse(value.requestsJson) as Array<{
        date: string;
        type: string;
        startTime?: string;
        endTime?: string;
        note?: string;
      }>;

      return handleUseCase(() =>
        submitShiftRequests({
          container,
          headers: args.request.headers,
          input: {
            staffProfileId: value.staffProfileId,
            tenantId: value.tenantId,
            requests,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;
  const targetPeriod = getNextWeekRange();

  // Get staff profiles to find current staff
  const profilesResult = await handleUseCase(() =>
    listStaffProfiles({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const firstProfile = profilesResult.items[0];
  const staffProfileId = firstProfile?.id ?? "";

  // Get existing shift requests
  const existingRequests = staffProfileId
    ? await handleUseCase(() =>
        listShiftRequests({
          container,
          headers: request.headers,
          input: {
            tenantId,
            startDate: targetPeriod.start,
            endDate: targetPeriod.end,
            staffProfileId,
          },
        }),
      ).match(
        (result) => result.items,
        () => [] as ShiftRequestDetail[],
      )
    : [];

  const dates = getDatesInRange(targetPeriod.start, targetPeriod.end);
  const shiftRequests = dates.map((date) => {
    const existing = existingRequests.find((r) => r.date === date);
    return {
      date,
      type: (existing?.type ?? "work") as "work" | "off",
      startTime: existing?.startTime ?? null,
      endTime: existing?.endTime ?? null,
      note: existing?.note ?? "",
    };
  });

  const isSubmitted = existingRequests.length > 0;

  return {
    targetPeriod,
    shiftRequests,
    isSubmitted,
    canEdit: true,
    staffProfileId,
    tenantId,
  };
}

export default function StaffShiftRequestsPage({
  loaderData,
}: Route.ComponentProps) {
  const {
    targetPeriod,
    shiftRequests,
    isSubmitted,
    canEdit,
    staffProfileId,
    tenantId,
  } = loaderData;

  const fetcher = useCompositeAction<typeof handlers>();

  const [submitForm] = useForm({
    id: "submit-shift-requests-form",
    lastResult:
      fetcher.data?.intent === "submitShiftRequests" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.submitShiftRequests.schema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.submitShiftRequests.schema,
      });
    },
  });

  fetcher.register("submitShiftRequests", {
    onSuccess: () => {
      // Shift requests submitted
    },
    onHandlerError: ({ error: err }) => {
      console.error("Shift request submission failed:", err);
    },
  });

  const isPending = fetcher.isPending("submitShiftRequests");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text">シフト希望提出</h1>

      {isSubmitted && (
        <Card className="border-success/30">
          <CardBody>
            <p className="text-sm text-success">
              シフト希望は提出済みです。
              {canEdit && "提出期限前であれば修正できます。"}
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-text-secondary">
            対象期間: {targetPeriod.start} 〜 {targetPeriod.end}
          </p>
        </CardHeader>
        <CardBody>
          <fetcher.Form
            method="post"
            {...getFormProps(submitForm)}
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);

              // Collect shift request data from form fields
              const requests = shiftRequests.map((req) => {
                const type =
                  (formData.get(`type-${req.date}`) as string) ?? "work";
                const startTime =
                  (formData.get(`startTime-${req.date}`) as string) ||
                  undefined;
                const endTime =
                  (formData.get(`endTime-${req.date}`) as string) || undefined;
                const note =
                  (formData.get(`note-${req.date}`) as string) || undefined;

                return {
                  date: req.date,
                  type,
                  ...(type === "work" && startTime && endTime
                    ? { startTime, endTime }
                    : {}),
                  ...(note ? { note } : {}),
                };
              });

              // Submit via fetcher
              const submitData = new FormData();
              submitData.set("intent", "submitShiftRequests");
              submitData.set("staffProfileId", staffProfileId);
              submitData.set("tenantId", tenantId);
              submitData.set("requestsJson", JSON.stringify(requests));

              fetcher.submit(submitData, { method: "post" });
            }}
          >
            <input type="hidden" name="intent" value="submitShiftRequests" />
            <input type="hidden" name="staffProfileId" value={staffProfileId} />
            <input type="hidden" name="tenantId" value={tenantId} />
            <input type="hidden" name="requestsJson" value="[]" />

            {shiftRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                対象期間のシフト希望データがありません。
              </p>
            ) : (
              <div className="divide-y divide-border">
                {shiftRequests.map((req) => (
                  <div
                    key={req.date}
                    className="flex flex-wrap items-center gap-3 py-3"
                  >
                    <span className="w-24 shrink-0 text-sm font-medium text-text">
                      {formatDateLabel(req.date)}
                    </span>
                    <div className="w-28">
                      <Select
                        name={`type-${req.date}`}
                        defaultValue={req.type}
                        disabled={!canEdit}
                      >
                        <option value="work">勤務希望</option>
                        <option value="off">休み希望</option>
                      </Select>
                    </div>
                    <input
                      type="time"
                      name={`startTime-${req.date}`}
                      defaultValue={req.startTime ?? ""}
                      disabled={!canEdit}
                      className="w-28 rounded-md border border-border bg-white px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-surface-secondary disabled:opacity-70"
                    />
                    <span className="text-text-muted">-</span>
                    <input
                      type="time"
                      name={`endTime-${req.date}`}
                      defaultValue={req.endTime ?? ""}
                      disabled={!canEdit}
                      className="w-28 rounded-md border border-border bg-white px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-surface-secondary disabled:opacity-70"
                    />
                    <input
                      type="text"
                      name={`note-${req.date}`}
                      defaultValue={req.note}
                      placeholder="備考"
                      disabled={!canEdit}
                      className="min-w-0 flex-1 rounded-md border border-border bg-white px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-surface-secondary disabled:opacity-70"
                    />
                  </div>
                ))}
              </div>
            )}

            {canEdit && (
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "提出中..."
                    : isSubmitted
                      ? "再提出"
                      : "提出する"}
                </Button>
              </div>
            )}

            {submitForm.errors && (
              <p className="mt-2 text-xs text-destructive">
                {submitForm.errors}
              </p>
            )}
          </fetcher.Form>
        </CardBody>
      </Card>
    </div>
  );
}
