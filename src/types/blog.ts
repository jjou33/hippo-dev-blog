export interface NavItem {
  title: string;
  href?: string;
  items?: NavItem[];
  isActive?: boolean;
  icon?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
  icon?: string;
}

export interface TableOfContentsItem {
  title: string;
  href: string;
  level: number;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  date: string;
  author?: string;
}
