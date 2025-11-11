import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [bulkTitles, setBulkTitles] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API_URL}/blog`);
      setArticles(response.data.articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const handleAIPrompt = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter an AI prompt');
      return;
    }

    setLoading(true);
    try {
    await axios.post(`${API_URL}/generate-single`, { 
        prompt: aiPrompt
      });
      
      alert('Article generated successfully!');
      setAiPrompt('');
      fetchArticles();
      setActiveTab('blog');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!bulkTitles.trim()) {
      alert('Please enter titles');
      return;
    }

    // Parse bulk input
    const lines = bulkTitles.split('\n').filter(line => line.trim());
    const titles = lines.map(line => {
      const parts = line.split('|');
      return {
        title: parts[0].trim(),
        details: parts[1]?.trim() || ''
      };
    });

    if (titles.length === 0) {
      alert('No valid titles found');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/generate-articles`, {
        titles
      });
      
      alert(`${response.data.count} articles generated successfully!`);
      setBulkTitles('');
      fetchArticles();
      setActiveTab('blog');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteAllArticles = async () => {
    if (window.confirm('Delete all articles?')) {
      try {
        await axios.delete(`${API_URL}/blog`);
        setArticles([]);
        setSelectedArticle(null);
        alert('All articles deleted');
      } catch (error) {
        alert('Error deleting articles');
      }
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🤖 AI Blog Generator</h1>
        <p>Generate programming articles using Gemini AI</p>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'generate' ? 'active' : ''} 
          onClick={() => setActiveTab('generate')}
        >
          Generate Articles
        </button>
        <button 
          className={activeTab === 'blog' ? 'active' : ''} 
          onClick={() => setActiveTab('blog')}
        >
          Blog ({articles.length})
        </button>
      </div>

      <div className="content">
        {activeTab === 'generate' && (
          <div className="generate-section">
            <div className="ai-prompt-section">
              <h2>AI Prompt Generator</h2>
              <p>Type any instruction to generate an article</p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Example: Write an article about React hooks with practical examples"
                rows="4"
              />
              <button onClick={handleAIPrompt} disabled={loading}>
                {loading ? 'Generating...' : '🚀 Generate from Prompt'}
              </button>
            </div>

            <div className="bulk-section">
              <h2>Bulk Article Generator</h2>
              <p>Enter titles (one per line). Add details after | symbol (optional)</p>
              <textarea
                value={bulkTitles}
                onChange={(e) => setBulkTitles(e.target.value)}
                placeholder="Understanding JavaScript Closures | Include examples with setTimeout
Advanced React Patterns | Cover hooks and context API
Node.js Performance Optimization
Python vs JavaScript: Key Differences
Docker for Beginners | Step-by-step tutorial
GraphQL vs REST API
TypeScript Best Practices
MongoDB Aggregation Pipeline
CI/CD with GitHub Actions
Microservices Architecture Patterns"
                rows="12"
              />
              <button onClick={handleBulkGenerate} disabled={loading}>
                {loading ? 'Generating...' : '📝 Generate All Articles'}
              </button>
            </div>

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Generating articles... This may take a minute...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'blog' && (
          <div className="blog-section">
            {!selectedArticle ? (
              <>
                <div className="blog-header">
                  <h2>Published Articles</h2>
                  {articles.length > 0 && (
                    <button onClick={deleteAllArticles} className="delete-btn">
                      🗑️ Delete All
                    </button>
                  )}
                </div>
                
                {articles.length === 0 ? (
                  <p className="empty-state">No articles yet. Generate some!</p>
                ) : (
                  <div className="articles-grid">
                    {articles.map(article => (
                      <div key={article.id} className="article-card">
                        <h3>{article.title}</h3>
                        <p className="article-date">
                          {new Date(article.createdAt).toLocaleDateString()}
                        </p>
                        {article.details && (
                          <p className="article-details">{article.details}</p>
                        )}
                        <button onClick={() => setSelectedArticle(article)}>
                          Read Article →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="article-view">
                <button onClick={() => setSelectedArticle(null)} className="back-btn">
                  ← Back to Articles
                </button>
                <article className="article-content">
                  <h1>{selectedArticle.title}</h1>
                  <p className="article-meta">
                    Published: {new Date(selectedArticle.createdAt).toLocaleString()}
                  </p>
                  <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
                </article>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
