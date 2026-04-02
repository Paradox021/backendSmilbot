// Migration script: uploads local images to the configured cloud provider
// and updates the imageUrl + imagePublicId in the database.
//
// Usage:
//   1. Set IMAGE_PROVIDER in .env to 'cloudinary' or 'supabase'
//   2. Set the required credentials for that provider
//   3. Run: node scripts/migrateImages.js
//
// What it does:
//   - Finds all cards in the database
//   - For each card that has a local image (in storage/images/), uploads it to the cloud provider
//   - Updates imageUrl and imagePublicId in the database
//   - Skips cards that already have an imagePublicId (already migrated)
//
// Safe to run multiple times — it won't re-upload already-migrated cards.

import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { Card } from '../models/card.js'
import { getImageProvider } from '../libs/imageHosting/index.js'

dotenv.config()

const __dirname = path.resolve()
const LOCAL_IMAGES_PATH = path.join(__dirname, 'storage', 'images')

async function migrate() {
    const provider = (process.env.IMAGE_PROVIDER || 'local').toLowerCase()

    if (provider === 'local') {
        console.log('⚠️  IMAGE_PROVIDER is set to "local". Nothing to migrate.')
        console.log('   Set IMAGE_PROVIDER to "cloudinary" or "supabase" in .env first.')
        process.exit(0)
    }

    console.log(`\n🚀 Starting migration to "${provider}"...\n`)

    // Connect to database
    mongoose.set('strictQuery', true)
    await mongoose.connect(process.env.URL_DB)
    console.log('✅ Connected to database')

    const imageProvider = getImageProvider()
    const cards = await Card.find()

    console.log(`📋 Found ${cards.length} cards in database\n`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const card of cards) {
        // Skip already-migrated cards
        if (card.imagePublicId) {
            console.log(`⏭️  "${card.name}" — already migrated, skipping`)
            skipped++
            continue
        }

        // Extract filename from the old URL
        // Old format: http://host/public/filename.png
        const oldUrl = card.imageUrl || ''
        let filename = oldUrl.split('/public/').pop()

        // Si tiene ? en el nombre, eliminarlo
        if (filename.includes('?')) {
            filename = filename.split('?')[0]
        }

        if (!filename) {
            console.log(`⚠️  "${card.name}" — no image URL found, skipping`)
            skipped++
            continue
        }

        const localFilePath = path.join(LOCAL_IMAGES_PATH, filename)

        // Check if the local file exists
        try {
            await fs.access(localFilePath)
        } catch {
            console.log(`⚠️  "${card.name}" — local file "${filename}" not found, skipping`)
            skipped++
            continue
        }

        // Read file and create a multer-like object for the provider
        try {
            const buffer = await fs.readFile(localFilePath)
            const ext = path.extname(filename).toLowerCase()
            const mimeTypes = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }

            const file = {
                buffer,
                originalname: filename,
                mimetype: mimeTypes[ext] || 'image/png',
                path: localFilePath
            }

            const { url, publicId } = await imageProvider.upload(file)

            // Update card in database
            card.imageUrl = url
            card.imagePublicId = publicId
            await card.save()

            console.log(`✅ "${card.name}" — migrated → ${url}`)
            migrated++
        } catch (error) {
            console.error(`❌ "${card.name}" — failed: ${error.message}`)
            errors++
        }
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log(`📊 Migration complete:`)
    console.log(`   ✅ Migrated: ${migrated}`)
    console.log(`   ⏭️  Skipped:  ${skipped}`)
    console.log(`   ❌ Errors:   ${errors}`)
    console.log(`${'='.repeat(50)}\n`)

    await mongoose.disconnect()
    process.exit(errors > 0 ? 1 : 0)
}

migrate().catch(error => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
})
