export type ProjectStatus =
  "Coming Soon" | "Completed" | "In Progress" | "On Hold";

export interface Project {
  slug: string;
  title: string;
  technology: string[];
  status: ProjectStatus;
  link?: string;
  summary?: string;
  tags?: string[];
}

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { badgeClass: string }
> = {
  Completed: {
    badgeClass: "bg-[var(--surface-alt)] text-[var(--success-green)]",
  },
  "In Progress": {
    badgeClass: "bg-[var(--surface-alt)] text-[var(--accent)]",
  },
  "On Hold": {
    badgeClass: "bg-[var(--surface-alt)] text-[var(--text-muted)]",
  },
  "Coming Soon": {
    badgeClass: "bg-[var(--surface-alt)] text-[var(--warning)]",
  },
};
