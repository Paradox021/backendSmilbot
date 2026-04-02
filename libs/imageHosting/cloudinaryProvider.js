// Cloudinary image hosting provider
// Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

import ImageProvider from './ImageProvider.js'
import { v2 as cloudinary } from 'cloudinary'

class CloudinaryProvider extends ImageProvider {
    constructor() {
        super()

        const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
            throw new Error(
                'Cloudinary config missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env'
            )
        }

        cloudinary.config({
            cloud_name: CLOUDINARY_CLOUD_NAME,
            api_key: CLOUDINARY_API_KEY,
            api_secret: CLOUDINARY_API_SECRET
        })

        this.folder = process.env.CLOUDINARY_FOLDER || 'smilbot'
    }

    async upload(file) {
        // Support both disk-stored files (file.path) and memory-stored files (file.buffer)
        const uploadSource = file.path || await this._bufferToDataUri(file)

        const result = await cloudinary.uploader.upload(uploadSource, {
            folder: this.folder,
            resource_type: 'image'
        })

        return {
            url: result.secure_url,
            publicId: result.public_id
        }
    }

    async delete(publicId) {
        if (!publicId) return

        await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image'
        })
    }

    getUrl(publicId) {
        return cloudinary.url(publicId, { secure: true })
    }

    /**
     * Convert a buffer file to a data URI for Cloudinary upload
     * @param {Object} file - Multer file with .buffer and .mimetype
     * @returns {string} Data URI
     */
    async _bufferToDataUri(file) {
        const base64 = file.buffer.toString('base64')
        return `data:${file.mimetype};base64,${base64}`
    }
}

export default CloudinaryProvider
