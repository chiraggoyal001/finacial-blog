import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar placeholder */}
      <div className="h-16 border-b border-border" />
      
      <main className="flex-1 container max-w-6xl py-8 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Skeleton */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                {/* User Info Skeleton */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>

                {/* Navigation Skeleton */}
                <nav className="space-y-1">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </nav>

                <Separator className="my-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Skeleton */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader className="text-center">
                {/* Avatar Skeleton */}
                <div className="flex justify-center mb-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                </div>
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <Skeleton className="h-5 w-40" />
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>

                {/* Professional Information Section */}
                <div className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Separator />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>

                {/* About You Section */}
                <div className="space-y-4">
                  <Skeleton className="h-5 w-20" />
                  <Separator />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>

                {/* Email Section */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>

                <Separator />
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
