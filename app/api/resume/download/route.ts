import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    try {
      await fs.access(filePath);
      const fileBuffer = await fs.readFile(filePath);
      const filename = filePath.split('/').pop() || 'resume';
      
      return new NextResponse(fileBuffer as BodyInit, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found or not accessible' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}