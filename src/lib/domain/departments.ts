
export const departments = [
  {
    id: "public-works",
    name: "Public Works Department",
  },
  {
    id: "education",
    name: "Education Department",
  },
  {
    id: "health",
    name: "Health Department",
  },
  {
    id: "revenue",
    name: "Revenue Department",
  },
  {
    id: "municipal-administration",
    name: "Municipal Administration",
  },
  {
    id: "transport",
    name: "Transport Department",
  },
] as const;

export type DepartmentId =
  (typeof departments)[number]["id"];

export function isValidDepartmentId(
  value: string,
): value is DepartmentId {
  return departments.some(
    (department) => department.id === value,
  );
}
