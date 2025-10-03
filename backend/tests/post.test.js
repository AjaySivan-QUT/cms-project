const chai = require('chai');
const expect = chai.expect;
const { PostSorter, DateSortStrategy, PopularitySortStrategy, TitleSortStrategy } = require('../src/patterns/strategy/SortStrategy');

describe('Strategy Pattern Tests', function() {
  
  it('should sort posts by date using DateSortStrategy', () => {
    const posts = [
      { title: 'Beta Post', createdAt: new Date('2024-01-01') },
      { title: 'Alpha Post', createdAt: new Date('2024-01-03') },
      { title: 'Gamma Post', createdAt: new Date('2024-01-02') }
    ];

    const sorter = new PostSorter(new DateSortStrategy());
    const sorted = sorter.sortPosts(posts);

    expect(sorted[0].title).to.equal('Alpha Post');
  });

  it('should sort posts by popularity using PopularitySortStrategy', () => {
    const posts = [
      { title: 'Beta Post', likes: 10, views: 100 },
      { title: 'Alpha Post', likes: 50, views: 500 },
      { title: 'Gamma Post', likes: 30, views: 300 }
    ];

    const sorter = new PostSorter(new PopularitySortStrategy());
    const sorted = sorter.sortPosts(posts);

    expect(sorted[0].title).to.equal('Alpha Post');
  });

  it('should sort posts alphabetically by title', () => {
    const posts = [
      { title: 'Gamma' },
      { title: 'Alpha' },
      { title: 'Beta' }
    ];

    const sorter = new PostSorter(new TitleSortStrategy());
    const sorted = sorter.sortPosts(posts);

    expect(sorted[0].title).to.equal('Alpha');
    expect(sorted[1].title).to.equal('Beta');
    expect(sorted[2].title).to.equal('Gamma');
  });
});

describe('Facade Pattern Tests', function() {
  it('should demonstrate Facade pattern exists', () => {
    const contentFacade = require('../src/patterns/facade/ContentManagementFacade');
    expect(contentFacade).to.have.property('createCompletePost');
  });
});