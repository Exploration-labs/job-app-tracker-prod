import { NextRequest, NextResponse } from 'next/server';
import { fetchJobDescriptionFromUrl } from '@/lib/url-fetcher';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    const result = await fetchJobDescriptionFromUrl(url);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text: result.text,
      hasHtml: !!result.html,
    });
  } catch (error) {
    console.error('Error in fetch-job API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}