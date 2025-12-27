'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Danh sách blog</h2>
        <Link href="/admin/blogs/create" className="btn btn-primary">
          <i className="fa fa-plus me-2"></i>Tạo blog mới
        </Link>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-blog fa-3x text-muted mb-3"></i>
              <p className="text-muted">Chưa có blog nào</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tiêu đề</th>
                    <th>Tác giả</th>
                    <th>Ngày đăng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((blog) => (
                    <tr key={blog.id}>
                      <td>{blog.id}</td>
                      <td>{blog.title}</td>
                      <td>{blog.author}</td>
                      <td>{blog.createdAt}</td>
                      <td>
                        <span className={`badge ${blog.status === 'published' ? 'bg-success' : 'bg-warning'}`}>
                          {blog.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary me-2">
                          <i className="fa fa-edit"></i>
                        </button>
                        <button className="btn btn-sm btn-danger">
                          <i className="fa fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

