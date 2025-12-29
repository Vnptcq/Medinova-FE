import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // NOTE: API route này không còn được sử dụng
    // Frontend đã tích hợp trực tiếp với backend API qua Orval (src/generated/api/endpoints/authentication/authentication.ts)
    // Route này chỉ giữ lại để tương thích ngược, nhưng sẽ trả về error
    return NextResponse.json(
      {
        message: 'This API route is deprecated. Please use the generated API client from Orval.',
      },
      { status: 410 } // 410 Gone - resource is no longer available
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

