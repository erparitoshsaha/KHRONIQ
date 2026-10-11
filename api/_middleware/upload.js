import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype && file.mimetype.startsWith('video');
    return {
      folder: 'zenith-watches',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'mp4', 'webm', 'mov']
    };
  }
});

// Filter for image-only uploads (10 MB limit)
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/jfif',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif'
  ];
  if (file.mimetype && (allowedMimes.includes(file.mimetype.toLowerCase()) || file.mimetype.startsWith('image/'))) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, WEBP, AVIF, and GIF images are allowed.'), false);
  }
};

// Filter for media gallery uploads (images and videos up to 50 MB)
const mediaFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/jfif',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];
  if (file.mimetype && (allowedMimes.includes(file.mimetype.toLowerCase()) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/'))) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only images (JPEG, PNG, WEBP, AVIF, GIF) and videos (MP4, WEBM) are allowed.'), false);
  }
};

// 1. Single product image uploader (10 MB max)
export const imageUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit for images
  },
  fileFilter: imageFileFilter
});

// 2. Admin media gallery uploader (50 MB max for videos & images)
export const mediaUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit for videos
  },
  fileFilter: mediaFileFilter
});

export default imageUpload;