// Image hosting factory
// Selects the active provider based on IMAGE_PROVIDER env variable
// Usage: import { imageService } from './libs/imageHosting/index.js'

import LocalProvider from './localProvider.js'
import CloudinaryProvider from './cloudinaryProvider.js'
import SupabaseProvider from './supabaseProvider.js'

const providers = {
    local: LocalProvider,
    cloudinary: CloudinaryProvider,
    supabase: SupabaseProvider
}

let _instance = null

/**
 * Returns the configured image provider instance (singleton).
 * @returns {import('./ImageProvider.js').default}
 */
function getImageProvider() {
    if (_instance) return _instance

    const providerName = (process.env.IMAGE_PROVIDER || 'local').toLowerCase()
    const ProviderClass = providers[providerName]

    if (!ProviderClass) {
        const available = Object.keys(providers).join(', ')
        throw new Error(
            `Unknown IMAGE_PROVIDER '${providerName}'. Available: ${available}`
        )
    }

    _instance = new ProviderClass()
    console.log(`📦 Image provider: ${providerName}`)
    return _instance
}

/**
 * Convenience wrapper — exposes upload/delete/getUrl directly.
 * Import this in controllers/services for the simplest API:
 *
 *   import { imageService } from '../libs/imageHosting/index.js'
 *   const { url, publicId } = await imageService.upload(file)
 */
const imageService = {
    async upload(file) {
        return getImageProvider().upload(file)
    },

    async delete(publicId) {
        return getImageProvider().delete(publicId)
    },

    getUrl(publicId) {
        return getImageProvider().getUrl(publicId)
    }
}

export { getImageProvider, imageService }
