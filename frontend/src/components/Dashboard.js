import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Save, X, FileText, Calendar, Activity, DollarSign, Image as ImageIcon } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function Dashboard({ user }) {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState({
    title: '',
    content: '',
    category: '',
    status: 'draft',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchPosts();
    fetchActivities();
  }, []);

  useEffect(() => {
    const filtered = posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.author?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(filtered);
  }, [searchTerm, posts]);

  const fetchPosts = async (sortParam = sortBy) => {
    try {
      const response = await fetch(`${API_URL}/posts?sortBy=${sortParam}`);
      const data = await response.json();
      setPosts(data);
      setFilteredPosts(data);
    } catch (error) {
      showNotification('Failed to fetch posts', 'error');
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.log('Activities not available');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    fetchPosts(newSort);
    showNotification(`Sorted by ${newSort} using Strategy Pattern`, 'success');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentPost({ ...currentPost, image: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDemoPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/payments/demo`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ provider: 'stripe', amount: 10, currency: 'USD' })
      });
      await response.json();
      showNotification('Payment demo successful! (Adapter Pattern)', 'success');
    } catch (error) {
      showNotification('Payment demo failed', 'error');
    }
  };

  const handleCreate = () => {
    setCurrentPost({
      title: '',
      content: '',
      category: '',
      status: 'draft',
      image: null
    });
    setImagePreview(null);
    setIsEditing(true);
  };

  const handleEdit = (post) => {
    setCurrentPost({
      ...post,
      category: typeof post.category === 'object' ? (post.category?.name || '') : (post.category || ''),
      image: null
    });
    setImagePreview(post.imageUrl ? `http://localhost:5001${post.imageUrl}` : null);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/posts/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showNotification('Post deleted successfully', 'success');
        fetchPosts();
        fetchActivities();
      } else {
        const data = await response.json();
        showNotification(data.message || 'Failed to delete post', 'error');
      }
    } catch (error) {
      showNotification('Failed to delete post', 'error');
    }
  };

  const handleSave = async () => {
    if (!currentPost.title || !currentPost.content) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const method = currentPost._id ? 'PUT' : 'POST';
      const url = currentPost._id ? `${API_URL}/posts/${currentPost._id}` : `${API_URL}/posts`;

      const formData = new FormData();
      formData.append('title', currentPost.title);
      formData.append('content', currentPost.content);
      formData.append('status', currentPost.status);
      
      if (currentPost.category && currentPost.category.trim() !== '') {
        formData.append('category', currentPost.category);
      }
      
      if (currentPost.image) {
        formData.append('image', currentPost.image);
      }

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        showNotification(`Post ${currentPost._id ? 'updated' : 'created'} successfully (Facade + Epic 4)`, 'success');
        setIsEditing(false);
        setImagePreview(null);
        fetchPosts();
        fetchActivities();
      } else {
        const data = await response.json();
        showNotification(data.message || 'Failed to save post', 'error');
      }
    } catch (error) {
      showNotification('Failed to save post', 'error');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImagePreview(null);
    setCurrentPost({
      title: '',
      content: '',
      category: '',
      status: 'draft',
      image: null
    });
  };

  const canEdit = (post) => {
    return user.role === 'admin' || post.author?._id === user.id;
  };

  const canCreate = () => {
    return user.role === 'admin' || user.role === 'editor';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Management Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.username}! (Role: {user?.role})</p>
      </div>

      {/* Design Patterns Demo Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Observer Pattern - Activity Feed */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Observer Pattern - Real Activities</h3>
          </div>
          <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
            {activities.length > 0 ? (
              activities.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span>{activity.icon}</span>
                  <span className="text-gray-700">{activity.message}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No recent activities</p>
            )}
          </div>
        </div>

        {/* Adapter Pattern - Payment Demo */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-900">Adapter Pattern</h3>
          </div>
          <button 
            onClick={handleDemoPayment}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
          >
            Demo Payment (Stripe/PayPal)
          </button>
          <p className="text-xs text-purple-700 mt-2">Unified interface for different payment providers</p>
        </div>
      </div>

      {notification.show && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {!isEditing ? (
        <>
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts by title, author, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
              <select 
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Latest First</option>
                <option value="popularity">Most Popular</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>

            {canCreate() && (
              <button
                onClick={handleCreate}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                <span>New Post</span>
              </button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map(post => (
              <div key={post._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
                {post.imageUrl && (
                  <img 
                    src={`http://localhost:5001${post.imageUrl}`} 
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 flex-1">{post.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>

                  <div className="space-y-2 mb-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{post.author?.username || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{post.category?.name || 'Uncategorized'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {canEdit(post) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="flex-1 flex items-center justify-center space-x-1 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No posts found</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">
            {currentPost._id ? 'Edit Post' : 'Create New Post'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={currentPost.title}
                onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                value={currentPost.content}
                onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter post content"
              />
            </div>

            {/* Image Upload - Epic 4 Integrated */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Featured Image (Epic 4: Media Management)</span>
                </div>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg shadow-md" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={currentPost.category}
                  onChange={(e) => setCurrentPost({ ...currentPost, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Post category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={currentPost.status}
                  onChange={(e) => setCurrentPost({ ...currentPost, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={user.role !== 'admin' && currentPost.status === 'published'}
                >
                  <option value="draft">Draft</option>
                  {user.role === 'admin' && <option value="published">Published</option>}
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                <Save className="w-5 h-5" />
                <span>Save Post</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center space-x-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}