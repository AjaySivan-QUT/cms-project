// Strategy Interface
class SortStrategy {
  sort(posts) {
    throw new Error('Sort method must be implemented');
  }
}

// Concrete Strategy: Sort by date
class DateSortStrategy extends SortStrategy {
  sort(posts) {
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

// Concrete Strategy: Sort by popularity
class PopularitySortStrategy extends SortStrategy {
  sort(posts) {
    return posts.sort((a, b) => (b.views + b.likes) - (a.views + a.likes));
  }
}

// Concrete Strategy: Sort by title
class TitleSortStrategy extends SortStrategy {
  sort(posts) {
    return posts.sort((a, b) => a.title.localeCompare(b.title));
  }
}

// Context class
class PostSorter {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  sortPosts(posts) {
    return this.strategy.sort(posts);
  }
}

module.exports = {
  PostSorter,
  DateSortStrategy,
  PopularitySortStrategy,
  TitleSortStrategy
};