// storage for card images
import multer from 'multer'
import path from 'path'

const __dirname = path.resolve()

const storage = multer.diskStorage({
    destination: path.join(__dirname, '/storage/images'),
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({storage})

export default upload