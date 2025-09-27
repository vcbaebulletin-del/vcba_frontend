import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  const cardClasses = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

// CardHeader component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  ...props
}) => {
  const headerClasses = [
    'card__header',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={headerClasses} {...props}>
      {children}
    </div>
  );
};

// CardTitle component
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  as: Component = 'h3',
  children,
  className = '',
  ...props
}) => {
  const titleClasses = [
    'card__title',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={titleClasses} {...props}>
      {children}
    </Component>
  );
};

// CardContent component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
  ...props
}) => {
  const contentClasses = [
    'card__content',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={contentClasses} {...props}>
      {children}
    </div>
  );
};

export default Card;
