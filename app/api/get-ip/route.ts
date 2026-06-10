export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') ||
               'unknown'
    
    return Response.json({ 
      ip: ip.split(',')[0].trim(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json({ ip: 'unknown', error: 'Could not determine IP' })
  }
}
