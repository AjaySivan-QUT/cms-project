const chai = require('chai');
const mongoose = require('mongoose');
const expect = chai.expect;
const Post = require('../src/models/Post');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const { PostSorter, DateSortStrategy, PopularitySortStrategy, TitleSortStrategy } = require('../src/patterns/strategy/SortStrategy');
const contentFacade = require('../src/patterns/facade/ContentManagementFacade');

describe('Post CRUD Tests', function() {
  this.timeout(10000);
  let testUser;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_advanced_test');
    }

    testUser = await User.create({
      username: 'posttest',
      email: 'posttest@test.com',
      password: 'password123',
      role: 'editor',
      isActive: true
    });
  });

  after(async () => {
    await User.findByIdAndDelete(testUser._id);
    await Post.deleteMany({ author: testUser._id });
    await Category.deleteMany({});
  });

  it('should create a post', async () => {
    const post = await Post.create({
      title: 'Test Post',
      content: 'Test Content',
      author: testUser._id,
      status: 'draft'
    });

    expect(post).to.have.property('title', 'Test Post');
    expect(post).to.have.property('content', 'Test Content');
    expect(post).to.have.property('status', 'draft');
  });

  it('should read a post', async () => {
    const created = await Post.create({
      title: 'Read Test',
      content: 'Read Content',
      author: testUser._id
    });

    const found = await Post.findById(created._id);
    expect(found).to.not.be.null;
    expect(found.title).to.equal('Read Test');
  });

  it('should update a post', async () => {
    const post = await Post.create({
      title: 'Update Test',
      content: 'Original Content',
      author: testUser._id
    });

    const updated = await Post.findByIdAndUpdate(
      post._id,
      { content: 'Updated Content' },
      { new: true }
    );

    expect(updated.content).to.equal('Updated Content');
  });

  it('should delete a post', async () => {
    const post = await Post.create({
      title: 'Delete Test',
      content: 'To be deleted',
      author: testUser._id
    });

    await Post.findByIdAndDelete(post._id);
    const found = await Post.findById(post._id);
    
    expect(found).to.be.null;
  });
});

describe('Strategy Pattern Tests', function() {
  this.timeout(10000);
  let posts;
  let testUser;

  before(async () => {
    testUser = await User.create({
      username: 'strategytest',
      email: 'strategy@test.com',
      password: 'pass123',
      role: 'editor',
      isActive: true
    });

    posts = await Post.create([
      { title: 'Beta Post', content: 'Content', author: testUser._id, likes: 10, createdAt: new Date('2024-01-01') },
      { title: 'Alpha Post', content: 'Content', author: testUser._id, likes: 50, createdAt: new Date('2024-01-03') },
      { title: 'Gamma Post', content: 'Content', author: testUser._id, likes: 30, createdAt: new Date('2024-01-02') }
    ]);
  });

  after(async () => {
    await Post.deleteMany({ author: testUser._id });
    await User.findByIdAndDelete(testUser._id);
  });

  it('should sort posts by date using DateSortStrategy', () => {
    const sorter = new PostSorter(new DateSortStrategy());
    const sorted = sorter.sortPosts(posts);

    expect(sorted[0].title).to.equal('Alpha Post');
    expect(sorted[2].title).to.equal('Beta Post');
  });

  it('should sort posts by popularity using PopularitySortStrategy', () => {
    const sorter = new PostSorter(new PopularitySortStrategy());
    const sorted = sorter.sortPosts(posts);

    expect(sorted[0].title).to.equal('Alpha Post');
    expect(sorted[1].title).to.equal('Gamma Post');
    expect(sorted[2].title).to.equal('Beta Post');
  });

  it('should sort posts by title using TitleSortStrategy', () => {
    const sorter = new PostSorter(new TitleSortStrategy());
    const sorted = sorter.sortPosts(posts);

    expect(sorted[0].title).to.equal('Alpha Post');
    expect(sorted[1].title).to.equal('Beta Post');
    expect(sorted[2].title).to.equal('Gamma Post');
  });
});

describe('Facade Pattern Tests', function() {
  this.timeout(10000);
  let testUser;

  before(async () => {
    testUser = await User.create({
      username: 'facadetest',
      email: 'facade@test.com',
      password: 'pass123',
      role: 'editor',
      isActive: true
    });
  });

  after(async () => {
    await Post.deleteMany({});
    await Category.deleteMany({});
    await User.findByIdAndDelete(testUser._id);
  });

  it('should create post with category using Facade pattern', async () => {
    const post = await contentFacade.createCompletePost(
      { title: 'Facade Test Post', content: 'Content' },
      'Technology',
      testUser._id
    );

    expect(post).to.have.property('title', 'Facade Test Post');
    expect(post.category).to.have.property('name', 'Technology');
  });

  it('should create category automatically if not exists', async () => {
    const post = await contentFacade.createCompletePost(
      { title: 'Auto Category Post', content: 'Content' },
      'NewCategory',
      testUser._id
    );

    const category = await Category.findOne({ name: 'NewCategory' });
    expect(category).to.not.be.null;
  });
});