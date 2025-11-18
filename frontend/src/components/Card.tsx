interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-gray-100 shadow-sm
        ${hover ? 'transition-all duration-200 hover:shadow-md hover:border-gray-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
