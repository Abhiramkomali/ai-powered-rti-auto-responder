import { RoutePlaceholder } from "@/components/route-placeholder";

export default function RegisterPage() {
  return (
    <RoutePlaceholder
      eyebrow="Get started"
      title="Register"
      description="Account registration will be introduced in a later development stage."
      links={[{ href: "/login", label: "Go to login" }]}
    />
  );
}
