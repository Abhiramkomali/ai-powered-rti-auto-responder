import { RoutePlaceholder } from "@/components/route-placeholder";

export default function OfficerDashboardPage() {
  return (
    <RoutePlaceholder
      eyebrow="Officer portal"
      title="Officer dashboard"
      description="A future workspace for authorized officers to view their department's RTI workflow."
      links={[{ href: "/officer/requests", label: "View request workspace" }]}
    />
  );
}
