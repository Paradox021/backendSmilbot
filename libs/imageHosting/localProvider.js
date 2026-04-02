// Local filesystem image provider
// Stores images in storage/images/ and serves them via express.static

import ImageProvider from './ImageProvider.js'
import fs from 'fs/promises'
import path from 'path'

const __dirname = path.resolve()

class LocalProvider extends ImageProvider {
    constructor() {
        super()
        this.storagePath = path.join(__dirname, 'storage', 'images')
        this.host = process.env.IMAGE_HOST || `http://localhost:${process.env.PORT || 3000}`
    }

    async upload(file) {
        // When using diskStorage, multer already saved the file to disk.
        // When using memoryStorage (e.g., during migration), we write it manually.
        if (file.buffer) {
            const filePath = path.join(this.storagePath, file.originalname)
            await fs.writeFile(filePath, file.buffer)
        }

        const publicId = file.originalname || file.filename
        return {
            url: `${this.host}/public/${publicId}`,
            publicId
        }
    }

    async delete(publicId) {
        if (!publicId) return

        const filePath = path.join(this.storagePath, publicId)
        try {
            await fs.unlink(filePath)
        } catch (error) {
            // File might not exist, that's ok
            if (error.code !== 'ENOENT') throw error
        }
    }

    getUrl(publicId) {
        return `${this.host}/public/${publicId}`
    }
}

export default LocalProvider
