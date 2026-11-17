import type { Metadata } from "next";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata: Metadata = {
  title: "How it works · Open Source Project Discovery Engine",
  description: "A step-by-step tour of the IR pipeline behind the search.",
};

export default function Tour() {
  return <Onboarding />;
}
