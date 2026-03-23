import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, redirect } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import type { ShiftRequestDetail } from "@/core/application/shift/listShiftRequests";
import { listShiftRequests } from "@/core/application/shift/listShiftRequests";
import { submitShiftRequests } from "@/core/application/shift/submitShiftRequests";
import { getStaffProfileByMemberId } from "@/core/application/staff/getStaffProfileByMemberId";
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
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((8 - day) % 7 || 7));
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
  const m = Number.parseInt(month, 10);
  const d = Number.parseInt(dayStr, 10);
  const date = new Date(Number.parseInt(dateStr.split("-")[0], 10), m - 1, d);
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

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  const currentMember = members.find((m) => m.tenantId === tenantId);
  if (!currentMember) {
    throw redirect("/admin/tenants");
  }

  const myProfile = await handleUseCase(() =>
    getStaffProfileByMemberId({
      container,
      headers: request.headers,
      input: { memberId: currentMember.id },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const staffProfileId = myProfile.id;

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
      toast.success("シフト希望を提出しました");
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "提出に失敗しました");
    },
  });

  const isPending = fetcher.isPending("submitShiftRequests");

  const periodLabel = (() => {
    const s = targetPeriod.start.split("-").map(Number);
    return `${s[0]}年${s[1]}月のシフト希望`;
  })();

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-900">
            シフト希望
          </h1>
          <p className="mt-1 text-sm text-text-muted">{periodLabel}</p>
        </div>
        {isSubmitted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.55_0.12_145/0.1)] px-3 py-1 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            提出済み
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.72_0.14_70/0.12)] px-3 py-1 text-xs font-medium text-accent-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            未提出
          </span>
        )}
      </div>

      {/* Shift Request Card */}
      <div className="rounded-[14px] border border-border bg-white">
        <div className="px-6 pt-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-text">
            対象期間: {targetPeriod.start} 〜 {targetPeriod.end}
          </h2>
        </div>

        <div className="p-6">
          <fetcher.Form
            method="post"
            {...getFormProps(submitForm)}
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);

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
              <div className="divide-y divide-surface-secondary">
                {shiftRequests.map((req) => (
                  <div
                    key={req.date}
                    className="flex flex-wrap items-center gap-4 py-4"
                  >
                    <span className="w-24 shrink-0 text-sm font-medium text-text">
                      {formatDateLabel(req.date)}
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-1.5 text-sm text-text">
                        <input
                          type="radio"
                          name={`type-${req.date}`}
                          value="work"
                          defaultChecked={req.type === "work"}
                          disabled={!canEdit}
                          className="h-4 w-4 accent-primary"
                        />
                        勤務希望
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5 text-sm text-text">
                        <input
                          type="radio"
                          name={`type-${req.date}`}
                          value="off"
                          defaultChecked={req.type === "off"}
                          disabled={!canEdit}
                          className="h-4 w-4 accent-primary"
                        />
                        休み希望
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        name={`startTime-${req.date}`}
                        defaultValue={req.startTime ?? ""}
                        disabled={!canEdit}
                        className="h-9 w-20 rounded-[10px] border border-border bg-white px-2 font-body text-sm text-text transition-colors duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary disabled:bg-surface-secondary disabled:opacity-70"
                      />
                      <span className="text-sm text-text-muted">-</span>
                      <input
                        type="time"
                        name={`endTime-${req.date}`}
                        defaultValue={req.endTime ?? ""}
                        disabled={!canEdit}
                        className="h-9 w-20 rounded-[10px] border border-border bg-white px-2 font-body text-sm text-text transition-colors duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary disabled:bg-surface-secondary disabled:opacity-70"
                      />
                    </div>
                    <input
                      type="text"
                      name={`note-${req.date}`}
                      defaultValue={req.note}
                      placeholder="備考"
                      disabled={!canEdit}
                      className="h-9 min-w-0 flex-1 rounded-[10px] border border-border bg-white px-2 font-body text-sm text-text transition-colors duration-150 placeholder:text-text-muted hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary disabled:bg-surface-secondary disabled:opacity-70"
                    />
                  </div>
                ))}
              </div>
            )}

            {submitForm.errors && (
              <p className="mt-2 text-xs text-error">{submitForm.errors}</p>
            )}

            {canEdit && (
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-none bg-primary px-8 text-sm font-medium tracking-wide text-white transition-colors duration-150 hover:bg-primary-dark active:scale-[0.99] disabled:opacity-60"
                >
                  {isPending
                    ? "提出中..."
                    : isSubmitted
                      ? "再提出する"
                      : "提出する"}
                </button>
              </div>
            )}
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
