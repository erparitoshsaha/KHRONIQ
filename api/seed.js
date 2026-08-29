import 'dotenv/config';
import mongoose from 'mongoose';
import Blog from './_models/Blog.js';
import Product from './_models/Product.js';
import connectDB from './utils/db.js';

async function seed() {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    // 1. Seed Default Blogs if collection is empty
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      const initialBlogs = [
        {
          title: "The Art of Swadeshi Horology",
          content: "Behind the scenes of KHRONIQ's Le Locle and Indian assembly processes, bringing high-precision chronometer watches to modern watch enthusiasts. Discover how we balance heritage design with modern components.",
          author: "Vikram R. Mehta",
          image: "/assets/lifestyle_black_cafe.jpg",
          category: "Horology"
        },
        {
          title: "Choosing the Right Case Finish",
          content: "A guide on selecting between polished stainless steel, rose gold PVD, and matte ceramic finishes for your bespoke timepiece. Learn which finish best suits your daily attire and lifestyle.",
          author: "Ananya Sharma",
          image: "/assets/lifestyle_pink_cafe.jpg",
          category: "Guides"
        }
      ];
      await Blog.insertMany(initialBlogs);
      console.log('Successfully seeded initial blogs.');
    } else {
      console.log(`Blogs collection already contains ${blogCount} documents. Skipping blog seed.`);
    }

    console.log('Seeding process finished.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
