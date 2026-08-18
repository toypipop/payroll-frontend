import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  actionButton?: ReactNode;
}

const PageHeader = ({ title, actionButton }: PageHeaderProps) => (
  <div className="mb-[22px] flex items-center justify-between border-b border-hover pb-4">
    <h1 className="text-[21px] font-extrabold leading-tight tracking-[-0.025em] text-main">{title}</h1>
    {actionButton && <div>{actionButton}</div>}
  </div>
);

export default PageHeader;
