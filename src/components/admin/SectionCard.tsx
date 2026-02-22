import React from "react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  action,
  children,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
};

export default SectionCard;
