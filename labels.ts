import { CATEGORIES, type CategoryId } from './emojiData';

export interface Labels {
  search: string;
  empty: string;
  recentEmpty: string;
  categories: Record<CategoryId, string>;
}

export interface PartialLabels {
  search?: string;
  empty?: string;
  recentEmpty?: string;
  categories?: Partial<Record<CategoryId, string>>;
}

export const DEFAULT_LABELS: Labels = {
  search: 'Поиск',
  empty: 'Ничего не найдено',
  recentEmpty: 'Пока нет недавних эмодзи',
  categories: Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<string, string>,
};

export function resolveLabels(custom?: PartialLabels): Labels {
  if (!custom) return DEFAULT_LABELS;
  return {
    search: custom.search ?? DEFAULT_LABELS.search,
    empty: custom.empty ?? DEFAULT_LABELS.empty,
    recentEmpty: custom.recentEmpty ?? DEFAULT_LABELS.recentEmpty,
    categories: { ...DEFAULT_LABELS.categories, ...(custom.categories as Record<CategoryId, string>) },
  };
}
