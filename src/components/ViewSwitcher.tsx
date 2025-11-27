import React from 'react';
import { LayoutGrid, List, Calendar, Kanban } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';

export type ViewType = 'list' | 'kanban' | 'calendar' | 'gallery';

interface ViewSwitcherProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    availableViews?: ViewType[];
}

export function ViewSwitcher({ currentView, onViewChange, availableViews = ['list', 'kanban'] }: ViewSwitcherProps) {
    return (
        <ToggleGroup type="single" value={currentView} onValueChange={(val) => val && onViewChange(val as ViewType)}>
            {availableViews.includes('list') && (
                <ToggleGroupItem value="list" aria-label="Lista">
                    <List className="h-4 w-4" />
                </ToggleGroupItem>
            )}
            {availableViews.includes('kanban') && (
                <ToggleGroupItem value="kanban" aria-label="Kanban">
                    <Kanban className="h-4 w-4" />
                </ToggleGroupItem>
            )}
            {availableViews.includes('calendar') && (
                <ToggleGroupItem value="calendar" aria-label="Calendário">
                    <Calendar className="h-4 w-4" />
                </ToggleGroupItem>
            )}
            {availableViews.includes('gallery') && (
                <ToggleGroupItem value="gallery" aria-label="Galeria">
                    <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
            )}
        </ToggleGroup>
    );
}
