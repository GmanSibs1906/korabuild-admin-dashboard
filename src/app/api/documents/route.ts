import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Document, DocumentFilters, DocumentSortOptions } from '@/types/documents';

// GET - Fetch documents with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const projectId = searchParams.get('project_id') || '';
    const documentType = searchParams.get('document_type') || '';
    const approvalStatus = searchParams.get('approval_status') || '';
    const uploadedBy = searchParams.get('uploaded_by') || '';
    const category = searchParams.get('category') || '';
    const sortField = searchParams.get('sort_field') || 'created_at';
    const sortDirection = searchParams.get('sort_direction') || 'desc';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    console.log('📄 Admin API: Fetching documents with filters:', {
      page, limit, search, projectId, documentType, approvalStatus
    });

    let query = supabaseAdmin
      .from('documents')
      .select(`
        *,
        uploader:uploaded_by(
          id,
          full_name,
          email
        ),
        approver:approved_by(
          id,
          full_name,
          email
        ),
        project:project_id(
          id,
          project_name
        )
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`document_name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    if (approvalStatus) {
      query = query.eq('approval_status', approvalStatus);
    }

    if (uploadedBy) {
      query = query.eq('uploaded_by', uploadedBy);
    }

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    if (tags.length > 0) {
      query = query.overlaps('tags', tags);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply sorting
    query = query.order(sortField, { ascending: sortDirection === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: documents, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching documents:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully fetched ${documents?.length || 0} documents (${count} total)`);

    return NextResponse.json({
      success: true,
      data: {
        documents: documents || [],
        total: count || 0,
        page,
        limit
      }
    });

  } catch (error) {
    console.error('❌ Error in documents API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Upload new document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('project_id') as string;
    const documentName = formData.get('document_name') as string;
    const documentType = formData.get('document_type') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const tagsString = formData.get('tags') as string;
    const isPublic = formData.get('is_public') === 'true';
    const uploadedBy = formData.get('uploaded_by') as string;

    if (!file || !documentName || !documentType || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📄 Uploading document:', { documentName, documentType, category });

    // Parse tags
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Upload file to Supabase Storage
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `documents/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Insert document record
    const { data: document, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        project_id: projectId || null,
        document_name: documentName,
        document_type: documentType,
        category,
        file_url: publicUrl,
        file_size_bytes: file.size,
        file_type: file.type,
        description: description || null,
        tags: tags.length > 0 ? tags : null,
        uploaded_by: uploadedBy || null,
        is_public: isPublic,
        approval_status: 'pending',
        download_count: 0,
        metadata: {
          original_filename: file.name,
          upload_timestamp: new Date().toISOString()
        }
      })
      .select(`
        *,
        uploader:uploaded_by(
          id,
          full_name,
          email
        ),
        project:project_id(
          id,
          project_name
        )
      `)
      .single();

    if (dbError) {
      console.error('❌ Error saving document record:', dbError);
      // Clean up uploaded file
      await supabaseAdmin.storage.from('documents').remove([filePath]);
      return NextResponse.json(
        { success: false, error: 'Failed to save document record', details: dbError.message },
        { status: 500 }
      );
    }

    console.log('✅ Document uploaded successfully:', document.id);

    return NextResponse.json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('❌ Error in document upload:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update document metadata
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    
    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      document_name,
      document_type,
      category,
      description,
      tags,
      is_public,
      approval_status
    } = body;

    console.log('📄 Updating document:', documentId);

    const updateData: any = {};
    if (document_name !== undefined) updateData.document_name = document_name;
    if (document_type !== undefined) updateData.document_type = document_type;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (approval_status !== undefined) {
      updateData.approval_status = approval_status;
      if (approval_status === 'approved') {
        updateData.approval_date = new Date().toISOString();
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select(`
        *,
        uploader:uploaded_by(
          id,
          full_name,
          email
        ),
        approver:approved_by(
          id,
          full_name,
          email
        ),
        project:project_id(
          id,
          project_name
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error updating document:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update document', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Document updated successfully:', documentId);

    return NextResponse.json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('❌ Error in document update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    
    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    console.log('📄 Deleting document:', documentId);

    // First get the document to get file path
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    const filePath = document.file_url.split('/').slice(-2).join('/');

    // Delete from database first
    const { error: dbError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('❌ Error deleting document from database:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete document', details: dbError.message },
        { status: 500 }
      );
    }

    // Delete file from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('documents')
      .remove([filePath]);

    if (storageError) {
      console.error('❌ Error deleting file from storage:', storageError);
      // Don't fail the request if file deletion fails
    }

    console.log('✅ Document deleted successfully:', documentId);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in document deletion:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 