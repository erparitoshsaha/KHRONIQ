import 'dotenv/config';
import mongoose from 'mongoose';
import Blog from './_models/Blog.js';
import Product from './_models/Product.js';
import User from './_models/User.js';
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

    // 2. Safe Admin Seeding from Environment Variables (ONLY if no admin exists)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (!existingAdmin) {
        const normalizedEmail = adminEmail.toLowerCase().trim();
        const userExists = await User.findOne({ email: normalizedEmail });
        if (!userExists) {
          const newAdmin = new User({
            name: 'Administrator',
            email: normalizedEmail,
            password: adminPassword, // will be hashed by pre-save hook
            role: 'admin'
          });
          await newAdmin.save();
          console.log(`Initial admin user created successfully for ${normalizedEmail}.`);
        } else {
          console.log(`User ${normalizedEmail} already exists. Skipping admin seed.`);
        }
      } else {
        console.log('Administrator account already exists. Skipping admin seed.');
      }
    }

    console.log('Seeding process finished.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
