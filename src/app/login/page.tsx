import { RoutePlaceholder } from "@/components/route-placeholder";

export default function LoginPage() {
  return (
    <RoutePlaceholder
      eyebrow="Welcome back"
      title="Login"
      description="Sign-in services are not part of this foundation stage."
      links={[{ href: "/register", label: "Create an account" }]}
    />
  );
}
