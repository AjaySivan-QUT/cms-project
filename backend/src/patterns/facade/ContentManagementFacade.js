const Post = require('../../models/Post');
const Category = require('../../models/Category');

class ContentManagementFacade {
  async createCompletePost(postData, categoryName, authorId) {
    try {
      // 1. Find or create category
      let category = await Category.findOne({ name: categoryName });
      if (!category) {
        const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
        category = await Category.create({ name: categoryName, slug });
      }

      // 2. Create post (with image data if provided)
      const post = await Post.create({
        ...postData,
        author: authorId,
        category: category._id
      });

      // 3. Return complete result
      return await Post.findById(post._id)
        .populate('author', 'username email')
        .populate('category', 'name slug');
    } catch (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  async publishPostWithNotification(postId) {
    try {
      const post = await Post.findByIdAndUpdate(
        postId,
        { status: 'published', publishedAt: new Date() },
        { new: true }
      );

      return post;
    } catch (error) {
      throw new Error(`Failed to publish post: ${error.message}`);
    }
  }

  async getPostWithComments(postId) {
    try {
      const post = await Post.findById(postId)
        .populate('author', 'username email')
        .populate('category', 'name');

      return { post };
    } catch (error) {
      throw new Error(`Failed to fetch post details: ${error.message}`);
    }
  }
}

module.exports = new ContentManagementFacade();