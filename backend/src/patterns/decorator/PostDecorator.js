// Base Component
class BasePost {
  constructor(post) {
    this.post = post;
  }

  getDetails() {
    return {
      title: this.post.title,
      content: this.post.content,
      author: this.post.author
    };
  }
}

// Decorator: Add view count
class ViewCountDecorator {
  constructor(post) {
    this.post = post;
  }

  getDetails() {
    const details = this.post.getDetails();
    details.views = this.post.post.views || 0;
    details.popularity = this.calculatePopularity();
    return details;
  }

  calculatePopularity() {
    const views = this.post.post.views || 0;
    const likes = this.post.post.likes || 0;
    return views + (likes * 2);
  }
}

// Decorator: Add SEO metadata
class SEODecorator {
  constructor(post) {
    this.post = post;
  }

  getDetails() {
    const details = this.post.getDetails();
    details.seo = {
      metaDescription: this.generateMetaDescription(details.content),
      keywords: this.extractKeywords(details.title, details.content),
      slug: this.generateSlug(details.title)
    };
    return details;
  }

  generateMetaDescription(content) {
    return content.substring(0, 160) + '...';
  }

  extractKeywords(title, content) {
    const text = (title + ' ' + content).toLowerCase();
    const words = text.split(/\s+/);
    return [...new Set(words.filter(word => word.length > 4))].slice(0, 5);
  }

  generateSlug(title) {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }
}

module.exports = { BasePost, ViewCountDecorator, SEODecorator };