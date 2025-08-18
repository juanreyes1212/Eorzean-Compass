import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-compass-950 container mx-auto px-4 py-8">
      <Skeleton className="h-32 w-full mb-8 bg-compass-800" />
      <div className="compass-card p-6 mb-6">
        <Skeleton className="h-8 w-64 mb-6 bg-compass-700" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-compass-700" />
            <Skeleton className="h-10 w-full bg-compass-700" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-compass-700" />
            <Skeleton className="h-10 w-full bg-compass-700" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-compass-700" />
            <Skeleton className="h-10 w-full bg-compass-700" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-compass-700" />
            <Skeleton className="h-10 w-full bg-compass-700" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-48 bg-compass-700" />
          <Skeleton className="h-8 w-full bg-compass-700" />
          <Skeleton className="h-8 w-full bg-compass-700" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="compass-card p-4"><Skeleton className="h-20 w-full bg-compass-700" /></Card>
        <Card className="compass-card p-4"><Skeleton className="h-20 w-full bg-compass-700" /></Card>
        <Card className="compass-card p-4"><Skeleton className="h-20 w-full bg-compass-700" /></Card>
        <Card className="compass-card p-4"><Skeleton className="h-20 w-full bg-compass-700" /></Card>
      </div>
      <Card className="compass-card p-6">
        <Skeleton className="h-10 w-full mb-4 bg-compass-700" />
        <Skeleton className="h-96 w-full bg-compass-700" />
      </Card>
    </div>
  );
}