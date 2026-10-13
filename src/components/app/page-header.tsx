type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header data-slot="page-header">
      {eyebrow === undefined ? null : (
        <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description === undefined ? null : (
        <p className="mt-2 text-sm text-foreground-muted">{description}</p>
      )}
    </header>
  );
}

export { PageHeader };
export type { PageHeaderProps };
