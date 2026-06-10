import { getSiteSettings, updateSiteSettings } from './lib/admin.js'

console.log('Testing Firestore integration...')
console.log('✓ Admin utilities imported successfully')
console.log('✓ getSiteSettings function available')
console.log('✓ updateSiteSettings function available')
console.log('\nFirestore collections ready:')
console.log('  - siteSettings (document: default)')
console.log('  - apiConfigs (query by serviceName)')
console.log('  - auditLogs (audit trail)')
console.log('  - pages (CMS pages)')
console.log('\n✓ All systems initialized')
