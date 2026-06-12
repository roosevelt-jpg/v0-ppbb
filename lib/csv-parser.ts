/**
 * CSV Parser for Members Import
 * Validates and parses CSV files for bulk member imports
 */

export interface MemberCSVRow {
  firstName: string
  lastName: string
  email: string
  phone?: string
  location?: string
  status?: 'active' | 'inactive' | 'pending'
}

export interface CSVParseResult {
  valid: MemberCSVRow[]
  errors: { row: number; error: string }[]
  total: number
}

/**
 * Parse CSV content and validate required fields
 */
export function parseCSV(csvContent: string): CSVParseResult {
  const lines = csvContent.split('\n').filter(line => line.trim())
  const result: CSVParseResult = {
    valid: [],
    errors: [],
    total: lines.length - 1, // Exclude header
  }

  if (lines.length < 2) {
    result.errors.push({ row: 0, error: 'CSV file is empty or has no data rows' })
    return result
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const requiredFields = ['firstname', 'lastname', 'email']
  
  const missingFields = requiredFields.filter(field => !headers.includes(field))
  if (missingFields.length > 0) {
    result.errors.push({
      row: 0,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    })
    return result
  }

  // Create field index map
  const fieldIndex = {
    firstName: headers.indexOf('firstname'),
    lastName: headers.indexOf('lastname'),
    email: headers.indexOf('email'),
    phone: headers.indexOf('phone'),
    location: headers.indexOf('location'),
    status: headers.indexOf('status'),
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim())

    if (!row[0]) continue // Skip empty rows

    try {
      const firstName = row[fieldIndex.firstName]?.trim()
      const lastName = row[fieldIndex.lastName]?.trim()
      const email = row[fieldIndex.email]?.trim()
      const phone = row[fieldIndex.phone]?.trim()
      const location = row[fieldIndex.location]?.trim()
      const status = row[fieldIndex.status]?.trim().toLowerCase() as 'active' | 'inactive' | 'pending'

      // Validate required fields
      if (!firstName) {
        result.errors.push({ row: i + 1, error: 'firstName is required' })
        continue
      }
      if (!lastName) {
        result.errors.push({ row: i + 1, error: 'lastName is required' })
        continue
      }
      if (!email || !isValidEmail(email)) {
        result.errors.push({ row: i + 1, error: 'Valid email is required' })
        continue
      }

      // Validate status if provided
      if (status && !['active', 'inactive', 'pending'].includes(status)) {
        result.errors.push({
          row: i + 1,
          error: `Invalid status '${status}'. Must be: active, inactive, or pending`,
        })
        continue
      }

      result.valid.push({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        location: location || undefined,
        status: status || 'active',
      })
    } catch (error) {
      result.errors.push({
        row: i + 1,
        error: `Error parsing row: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  return result
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Convert Members data to CSV format
 */
export function membersToCSV(members: MemberCSVRow[]): string {
  const headers = ['firstName', 'lastName', 'email', 'phone', 'location', 'status']
  const rows = members.map(m => [
    m.firstName,
    m.lastName,
    m.email,
    m.phone || '',
    m.location || '',
    m.status || 'active',
  ])
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}
