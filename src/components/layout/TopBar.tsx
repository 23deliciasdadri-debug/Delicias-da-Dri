import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';

interface TopBarProps {
  title: string;
  onOpenSidebar: () => void;
  userName?: string;
  userRole?: string;
  avatarUrl?: string | null;
  actions?: React.ReactNode;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  onOpenSidebar,
  userName,
  userRole,
  avatarUrl,
  actions,
  className,
}) => (
  <header
    className={cn(
      'sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border/70 bg-white/80 px-4 py-3 backdrop-blur lg:px-8',
      className,
    )}
  >
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Abrir menu lateral"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Button>
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Você está em
        </span>
        <p className="text-base font-semibold text-foreground lg:text-lg">{title}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {actions}
      <div className="flex items-center gap-2 rounded-full border border-border/70 bg-white px-3 py-1.5 shadow-sm">
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatarUrl ?? undefined} alt={userName ?? 'Usuário'} />
          <AvatarFallback>
            {(userName ?? 'Usuário')
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-tight text-foreground">{userName ?? 'Usuário'}</p>
          {userRole ? (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {userRole}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  </header>
);
