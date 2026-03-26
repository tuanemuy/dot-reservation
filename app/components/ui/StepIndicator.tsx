type StepDef = {
  id: number;
  label: string;
};

type StepIndicatorProps = {
  currentStep: number;
  steps: StepDef[];
};

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center pt-8 pb-10">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isUpcoming = step.id > currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center size-8 rounded-full text-sm font-semibold font-heading ${isUpcoming ? "bg-neutral-200 text-neutral-500" : "bg-primary text-white"} ${isActive ? "shadow-[0_0_0_4px_var(--color-primary-lighter)]" : ""}`}
              >
                {isCompleted ? (
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <title>完了</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`text-sm font-medium ${isCompleted ? "text-primary" : isActive ? "text-neutral-900" : "text-neutral-500"}`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 ${step.id < currentStep ? "bg-primary" : "bg-neutral-300"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export type { StepDef };
