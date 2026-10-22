import {
  BookOpen,
  Briefcase,
  Check,
  ChevronRight,
  Code2,
  Compass,
  Map,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GuidedJourney.css";

const steps = [
  {
    label: "Discover",
    short: "Choose your direction",
    path: "/prepare",
    icon: Compass,
    matches: (path: string) => path === "/prepare",
  },
  {
    label: "Plan",
    short: "See your next steps",
    path: "/workflow",
    icon: Map,
    matches: (path: string) => path === "/workflow",
  },
  {
    label: "Learn",
    short: "Build the foundations",
    path: "/dashboard",
    icon: BookOpen,
    matches: (path: string) =>
      path === "/dashboard" || path.startsWith("/category/"),
  },
  {
    label: "Practice",
    short: "Turn knowledge into skill",
    path: "/practice",
    icon: Code2,
    matches: (path: string) =>
      path === "/practice" || path.startsWith("/studio/"),
  },
  {
    label: "Get ready",
    short: "Know where to apply",
    path: "/companies/chances",
    icon: Briefcase,
    matches: (path: string) => path === "/companies/chances",
  },
];

export default function GuidedJourney() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeIndex = steps.findIndex((step) => step.matches(pathname));

  if (activeIndex < 0 || pathname.startsWith("/studio/")) return null;

  const activeStep = steps[activeIndex];
  const nextStep = steps[activeIndex + 1];

  return (
    <section className="journey-shell" aria-label="Your interview preparation journey">
      <div className="journey-inner">
        <div className="journey-summary">
          <span>
            STEP {activeIndex + 1} OF {steps.length}
          </span>
          <strong>{activeStep.short}</strong>
        </div>

        <ol className="journey-steps">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const completed = index < activeIndex;
            const active = index === activeIndex;
            return (
              <li key={step.label} className={completed ? "completed" : ""}>
                <button
                  type="button"
                  className={active ? "active" : ""}
                  onClick={() => navigate(step.path)}
                  aria-current={active ? "step" : undefined}
                  aria-label={`${step.label}: ${step.short}`}
                >
                  <span>{completed ? <Check /> : <Icon />}</span>
                  <b>{step.label}</b>
                </button>
              </li>
            );
          })}
        </ol>

        {nextStep ? (
          <button
            type="button"
            className="journey-next"
            onClick={() => navigate(nextStep.path)}
          >
            <span>Next</span>
            {nextStep.label}
            <ChevronRight />
          </button>
        ) : (
          <button
            type="button"
            className="journey-next"
            onClick={() => navigate("/workflow")}
          >
            <span>Keep growing</span>
            Review plan
            <ChevronRight />
          </button>
        )}
      </div>
    </section>
  );
}
