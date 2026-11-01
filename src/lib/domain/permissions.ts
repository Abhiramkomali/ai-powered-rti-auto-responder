export const userRoles = [
  "CITIZEN",
  "APIO",
  "DEALING_OFFICER",
  "PIO",
  "FIRST_APPELLATE_AUTHORITY",
  "DEPARTMENT_ADMIN",
  "PLATFORM_ADMIN",
] as const;

export type UserRole = (typeof userRoles)[number];

export const permissions = [
  "request:create",
  "request:read:own",
  "request:update:draft:own",
  "request:withdraw:own",
  "request:read:department",
  "request:route:department",
  "request:read:appeal",
  "request:decide:assigned",
  "response:draft:assigned",
  "response:review:assigned",
  "response:approve:assigned",
  "response:issue:assigned",
  "document:upload:own-request",
  "document:read:own-request",
  "document:read:department-request",
  "department:manage-members",
  "department:manage-documents",
  "analytics:read:department",
  "platform:operate",
] as const;

export type Permission = (typeof permissions)[number];

export const rolePermissions = {
  CITIZEN: [
    "request:create",
    "request:read:own",
    "request:update:draft:own",
    "request:withdraw:own",
    "document:upload:own-request",
    "document:read:own-request",
  ],
  APIO: [
    "request:read:department",
    "request:route:department",
    "document:read:department-request",
  ],
  DEALING_OFFICER: [
    "request:read:department",
    "response:draft:assigned",
    "response:review:assigned",
    "document:read:department-request",
  ],
  PIO: [
    "request:read:department",
    "request:route:department",
    "request:decide:assigned",
    "response:draft:assigned",
    "response:review:assigned",
    "response:approve:assigned",
    "response:issue:assigned",
    "document:read:department-request",
  ],
  FIRST_APPELLATE_AUTHORITY: ["request:read:appeal"],
  DEPARTMENT_ADMIN: [
    "department:manage-members",
    "department:manage-documents",
    "analytics:read:department",
  ],
  PLATFORM_ADMIN: ["platform:operate"],
} as const satisfies Record<UserRole, readonly Permission[]>;

export function roleHasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return (rolePermissions[role] as readonly Permission[]).includes(permission);
}
