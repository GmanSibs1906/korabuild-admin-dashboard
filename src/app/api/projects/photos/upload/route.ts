import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Photo Upload API: Starting upload process');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const milestoneId = formData.get('milestoneId') as string | null;
    const photoTitle = formData.get('photoTitle') as string;
    const description = formData.get('description') as string;
    const phaseCategory = formData.get('phaseCategory') as string;
    const photoType = formData.get('photoType') as string;
    const uploadedBy = formData.get('uploadedBy') as string;

    // Validate required fields
    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'File and projectId are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFilename = `${projectId}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    console.log('📸 Uploading file to storage:', {
      filename: uniqueFilename,
      size: file.size,
      type: file.type,
      projectId
    });

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('project-photos')
      .upload(uniqueFilename, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('project-photos')
      .getPublicUrl(uniqueFilename);

    const photoUrl = publicUrlData.publicUrl;

    console.log('📸 File uploaded successfully, saving to database:', {
      photoUrl,
      projectId,
      phaseCategory
    });

    // Get image dimensions (basic metadata)
    const imageDimensions = {
      width: 0,
      height: 0,
      aspectRatio: 0
    };

    // Save photo metadata to database
    const { data: photoRecord, error: dbError } = await supabaseAdmin
      .from('project_photos')
      .insert({
        project_id: projectId,
        milestone_id: milestoneId || null,
        photo_url: photoUrl,
        photo_title: photoTitle || null,
        description: description || null,
        phase_category: phaseCategory || 'general',
        photo_type: photoType || 'progress',
        date_taken: new Date().toISOString(),
        uploaded_by: (uploadedBy && uploadedBy !== 'admin') ? uploadedBy : null,
        file_size_bytes: file.size,
        image_dimensions: imageDimensions,
        processing_status: 'completed',
        is_featured: false,
        likes_count: 0,
        views_count: 0,
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('project-photos')
        .remove([uniqueFilename]);

      return NextResponse.json(
        { error: 'Failed to save photo metadata to database', details: dbError.message },
        { status: 500 }
      );
    }

    console.log('✅ Photo uploaded and saved successfully:', photoRecord.id);

    return NextResponse.json({
      success: true,
      data: {
        id: photoRecord.id,
        photo_url: photoRecord.photo_url,
        photo_title: photoRecord.photo_title,
        description: photoRecord.description,
        phase_category: photoRecord.phase_category,
        photo_type: photoRecord.photo_type,
        file_size_bytes: photoRecord.file_size_bytes,
        processing_status: photoRecord.processing_status,
        created_at: photoRecord.created_at
      },
      message: 'Photo uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Photo upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve upload progress or photo details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    const { data: photo, error } = await supabaseAdmin
      .from('project_photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (error) {
      console.error('❌ Error fetching photo:', error);
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: photo
    });

  } catch (error) {
    console.error('❌ Error in photo GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
