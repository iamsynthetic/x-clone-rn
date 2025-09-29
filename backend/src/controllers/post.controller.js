import expressAsyncHandler from "express-async-handler";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { getAuth } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";
import Notification from "../models/notification.model.js";
import Comment from "../models/comment.model.js";

export const getPosts = expressAsyncHandler(async (req, res) => {
  const posts = await Post.find()
    .sort({ crreatedAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstname lastname profilePicture",
      },
    });

  res.status(200).json({ posts });
});

export const getPost = expressAsyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId)
    .populate("user", "username firstName lastName profile")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });
  if (!post) return res.status(404).json({ error: "post not found" });
  res.status(200).json({ post });
});

export const getUserPosts = expressAsyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await Post.findOne({ username });
  if (!user) return res.status(404).json({ error: "user not found" });
  const posts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });
  res.status(200).json({ posts });
});

export const createPost = expressAsyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { content } = req.body;
  const imageFile = req.file;

  if (!content && !imageFile) {
    return res
      .status(400)
      .json({ error: "post must contain either text or image" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "user not found" });

  let imageUrl = "";

  if (imageFile) {
    try {
      const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: "social_media_posts",
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
          { format: "auto" },
        ],
      });
      imageUrl = uploadResponse.secure_url;
    } catch (uploadError) {
      console.error("cloudinary upload error:", uploadError);
      return res.status(400).json({ error: "failed to upload image" });
    }
  }

  const post = await Post.create({
    user: user._id,
    contnet: content || "",
    image: imageUrl,
  });

  res.status(201).json({ post });
});

export const likePost = expressAsyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post)
    return res.status(404).json({ error: "user or post not found" });

  const isLiked = post.likes.includes(user._id);

  if (isLiked) {
    await Post.findByIdAndUpdate(postId, {
      $pull: { likes: user._id },
    });
  } else {
    await Post.findByIdAndUpdate(postId, {
      $push: { likes: user._id },
    });

    if (post.user.toString() !== user._id.toString()) {
      await Notification.create({
        from: user._id,
        to: post.user,
        type: "like",
        post: postId,
      });
    }
  }

  res.status(200).json({
    message: isLiked ? "poost unliked successfully" : "post liekd successfully",
  });
});

export const deletePost = expressAsyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(post);

  if (!user || !post)
    return res.status(404).json({ error: "user or post not found" });

  if (post.user.toString() !== user._id.toString()) {
    return res
      .status(403)
      .json({ error: "you can only delete your own posts" });
  }

  await Comment.deleteMany({ post: postId });

  await Post.findByIdAndDelete(postId);

  res.status(200).json({ message: "post deleted successfully" });
});
