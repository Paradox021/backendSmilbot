// Base class for image hosting providers
// All providers must implement these methods

class ImageProvider {
    /**
     * Upload an image file to the hosting service.
     * @param {Object} file - Multer file object (has .path for disk, .buffer for memory)
     * @returns {Promise<{url: string, publicId: string}>}
     */
    async upload(file) {
        throw new Error(`upload() not implemented in ${this.constructor.name}`)
    }

    /**
     * Delete an image from the hosting service.
     * @param {string} publicId - The public identifier of the image
     * @returns {Promise<void>}
     */
    async delete(publicId) {
        throw new Error(`delete() not implemented in ${this.constructor.name}`)
    }

    /**
     * Get the public URL of an image.
     * @param {string} publicId - The public identifier of the image
     * @returns {string}
     */
    getUrl(publicId) {
        throw new Error(`getUrl() not implemented in ${this.constructor.name}`)
    }
}

export default ImageProvider
