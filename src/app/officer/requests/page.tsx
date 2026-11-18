import { RoutePlaceholder } from "@/components/route-placeholder";

export default function OfficerRequestsPage() {
  return (
    <RoutePlaceholder
      eyebrow="Officer portal"
      title="Request workspace"
      description="Request queues, assignment, and officer review tools are planned for a later development stage."
      links={[{ href: "/officer/dashboard", label: "Officer dashboard" }]}
    />
  );
}
