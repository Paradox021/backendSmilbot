// Multer middleware for handling file uploads
// Adapts storage strategy based on the configured image provider:
// - 'local': uses diskStorage (saves to storage/images/)
// - any cloud provider: uses memoryStorage (file.buffer available for upload)

import multer from 'multer'
import path from 'path'

const __dirname = path.resolve()

function createUploadMiddleware() {
    const provider = (process.env.IMAGE_PROVIDER || 'local').toLowerCase()

    let storage

    if (provider === 'local') {
        // Local: save directly to disk, served via express.static
        storage = multer.diskStorage({
            destination: path.join(__dirname, 'storage', 'images'),
            filename: (req, file, cb) => {
                cb(null, file.originalname)
            }
        })
    } else {
        // Cloud providers: keep file in memory for upload via SDK
        storage = multer.memoryStorage()
    }

    return multer({ storage })
}

const upload = createUploadMiddleware()

export default upload