import { notFound } from "next/navigation";
import { ConsoleShell } from "@/app/components/console-shell";
import { FeatureWorkspace } from "@/app/components/feature-workspace";
import { FEATURES, getFeatureBySlug } from "@/lib/feature-registry";

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

interface FeaturePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 单功能独立页面：/features/[slug]
 */
export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) {
    notFound();
  }

  return (
    <ConsoleShell title={feature.name} description={feature.description}>
      <FeatureWorkspace feature={feature} />
    </ConsoleShell>
  );
}
