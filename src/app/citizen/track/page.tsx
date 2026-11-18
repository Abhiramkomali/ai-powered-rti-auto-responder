import { RoutePlaceholder } from "@/components/route-placeholder";

export default function CitizenTrackPage() {
  return (
    <RoutePlaceholder
      eyebrow="Citizen portal"
      title="Track your application"
      description="Application lookup and status updates are planned for a later development stage."
      links={[
        { href: "/citizen/dashboard", label: "Citizen portal" },
        { href: "/citizen/submit", label: "Submit an RTI request" },
      ]}
    />
  );
}
