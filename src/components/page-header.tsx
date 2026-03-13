import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

type BreadcrumbEntry = {
  name: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  breadcrumb?: BreadcrumbEntry[];
  children?: React.ReactNode;
};

export function PageHeader({ title, breadcrumb, children }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumb.map((entry, idx) => {
              const isLast = idx === breadcrumb.length - 1;
              return (
                <BreadcrumbItem key={entry.name}>
                  {isLast ? (
                    <BreadcrumbPage>{entry.name}</BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink href={entry.href}>
                        {entry.name}
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
      <Separator />
    </div>
  );
}
