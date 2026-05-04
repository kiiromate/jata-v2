import { serve } from 'std/http/server.ts'
import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, getUserId } from '../_shared/db.ts'

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseClient(req)
    const userId = await getUserId(req)

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const resumeName = formData.get('resumeName') as string | null

    if (!file || !resumeName) {
      return new Response(JSON.stringify({ error: 'Missing file or resumeName' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const filePath = `${userId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Storage Error:', uploadError)
      return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    let resumeContent = ''
    const fileBuffer = await file.arrayBuffer()

    if (file.type === 'application/pdf') {
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((item: any) => item.str).join(' ') + '\n'
      }
      resumeContent = text
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer })
      resumeContent = result.value
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported file type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { error: dbError } = await supabase.from('resumes').insert({
      user_id: userId,
      filename: resumeName,
      content: resumeContent,
    })

    if (dbError) {
      console.error('Database Error:', dbError)
      return new Response(JSON.stringify({ error: 'Failed to save resume data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify({ message: 'Resume uploaded successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (e) {
    const error = e as Error
    console.error('Unhandled Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
