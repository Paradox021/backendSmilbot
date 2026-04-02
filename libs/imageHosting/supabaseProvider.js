// Supabase Storage image hosting provider
// Requires: SUPABASE_URL, SUPABASE_KEY
// Optional: SUPABASE_BUCKET (default: 'smilbot-images')

import ImageProvider from './ImageProvider.js'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

class SupabaseProvider extends ImageProvider {
    constructor() {
        super()

        const { SUPABASE_URL, SUPABASE_KEY } = process.env

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            throw new Error(
                'Supabase config missing. Set SUPABASE_URL and SUPABASE_KEY in .env'
            )
        }

        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        this.bucket = process.env.SUPABASE_BUCKET || 'smilbot-images'
        this.initialized = false
    }

    /**
     * Ensures the bucket exists, creating it if necessary.
     * Only runs once (lazy initialization).
     */
    async _ensureBucket() {
        if (this.initialized) return

        const { data: buckets } = await this.supabase.storage.listBuckets()
        const exists = buckets?.some(b => b.name === this.bucket)

        if (!exists) {
            const { error } = await this.supabase.storage.createBucket(this.bucket, {
                public: true,
                fileSizeLimit: 10 * 1024 * 1024 // 10MB max
            })
            if (error) throw new Error(`Failed to create Supabase bucket: ${error.message}`)
            console.log(`✅ Supabase bucket '${this.bucket}' created`)
        }

        this.initialized = true
    }

    async upload(file) {
        await this._ensureBucket()

        // Read file content from disk or use buffer directly
        let fileBuffer
        let fileName

        if (file.buffer) {
            fileBuffer = file.buffer
            fileName = file.originalname
        } else if (file.path) {
            fileBuffer = await fs.readFile(file.path)
            fileName = file.filename || path.basename(file.path)
        } else {
            throw new Error('File has no buffer or path')
        }

        // Generate a unique name to avoid collisions
        const uniqueName = `${Date.now()}-${fileName}`
        const filePath = `cards/${uniqueName}`

        const { error } = await this.supabase.storage
            .from(this.bucket)
            .upload(filePath, fileBuffer, {
                contentType: file.mimetype || 'image/png',
                upsert: false
            })

        if (error) throw new Error(`Supabase upload failed: ${error.message}`)

        const { data: urlData } = this.supabase.storage
            .from(this.bucket)
            .getPublicUrl(filePath)

        return {
            url: urlData.publicUrl,
            publicId: filePath
        }
    }

    async delete(publicId) {
        if (!publicId) return

        await this._ensureBucket()

        const { error } = await this.supabase.storage
            .from(this.bucket)
            .remove([publicId])

        if (error) throw new Error(`Supabase delete failed: ${error.message}`)
    }

    getUrl(publicId) {
        const { data } = this.supabase.storage
            .from(this.bucket)
            .getPublicUrl(publicId)

        return data.publicUrl
    }
}

export default SupabaseProvider
