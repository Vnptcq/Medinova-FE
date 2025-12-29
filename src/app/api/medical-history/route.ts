import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // API này không còn được sử dụng vì đã tích hợp trực tiếp với backend API
    // Trả về empty array để tránh lỗi
    return NextResponse.json(
      {
        history: [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Medical history error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

