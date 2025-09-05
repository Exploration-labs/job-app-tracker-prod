import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { extname } from 'path';

async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase();
  
  try {
    switch (ext) {
      case '.txt':
        // Direct text file reading
        return await fs.readFile(filePath, 'utf-8');
      
      case '.pdf':
        try {
          const pdf = (await import('pdf-parse')).default;
          const dataBuffer = await fs.readFile(filePath);
          const pdfData = await pdf(dataBuffer);
          return pdfData.text || '[PDF Resume - No text content could be extracted]';
        } catch (pdfError) {
          console.warn('PDF extraction failed:', pdfError);
          return `[PDF Resume - ${filePath}]\n\nFailed to extract text from PDF file.\nThe resume file exists and can be opened directly.\n\nError: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF parsing error'}`;
        }
      
      case '.doc':
      case '.docx':
        try {
          const mammoth = (await import('mammoth')).default;
          const dataBuffer = await fs.readFile(filePath);
          const result = await mammoth.extractRawText({ buffer: dataBuffer });
          return result.value || '[Word Document Resume - No text content could be extracted]';
        } catch (docError) {
          console.warn('Word document extraction failed:', docError);
          return `[Word Document Resume - ${filePath}]\n\nFailed to extract text from Word document.\nThe resume file exists and can be opened directly.\n\nError: ${docError instanceof Error ? docError.message : 'Unknown Word parsing error'}`;
        }
      
      case '.rtf':
        // RTF is essentially plain text with formatting codes, we can do basic extraction
        try {
          const rtfContent = await fs.readFile(filePath, 'utf-8');
          // Basic RTF text extraction - remove RTF control codes
          const plainText = rtfContent
            .replace(/\\[a-z]+[0-9]*\s?/gi, '') // Remove RTF control words
            .replace(/[{}]/g, '') // Remove braces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          return plainText || '[RTF Resume - No text content could be extracted]';
        } catch (rtfError) {
          console.warn('RTF extraction failed:', rtfError);
          return `[RTF Resume - ${filePath}]\n\nFailed to extract text from RTF file.\nThe resume file exists and can be opened directly.\n\nError: ${rtfError instanceof Error ? rtfError.message : 'Unknown RTF parsing error'}`;
        }
      
      default:
        return `[Unsupported file format - ${ext}]\n\nThis file type is not supported for text extraction.\nThe resume file exists and can be opened directly.`;
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    return `[Error extracting text from ${filePath}]\n\nAn error occurred while trying to extract text from this resume.\nThe resume file may still be accessible by opening it directly.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();
    
    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found', filePath },
        { status: 404 }
      );
    }

    // Extract text from the file
    const extractedText = await extractTextFromFile(filePath);

    return NextResponse.json({
      success: true,
      filePath,
      text: extractedText,
      fileType: extname(filePath).toLowerCase()
    });

  } catch (error) {
    console.error('Resume text extraction error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to extract text from resume',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}