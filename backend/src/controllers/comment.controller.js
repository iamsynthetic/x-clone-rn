import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import Comment from "../models/comment.model";
import Post from "../models/post.model";
import User from "../models/user.model";
import Notification from "../models/notification.model";

export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture");
  res.status(200).json({ comments });
});

export const createComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "comment content is required" });
  }

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);
  if (!user || !post)
    return res.status(400).json({ error: "user or post not found" });

  const comment = await Comment.create({
    user: user._id,
    post: postId,
    content,
  });

  await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

  if (post.user.toString() !== user._id.tooString()) {
    await Notification.create({
      from: user._id,
      to: post.user,
      type: "comment",
      post: postId,
      comment: comment._id,
    });
  }

  res.status(201).json({ comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { commentId } = req.params;
  const user = await User.findOne({ clerkId: userId });
  const comment = await Comment.findById(commentId);

  if (!user || !comment)
    return res.status(404).json({ error: "user or comment not found" });

  if (comment.user.toString() !== user._id.toString()) {
    return res
      .status(403)
      .json({ error: "you can only delete your own comments" });
  }

  await Post.findByIdAndUpdate(comment.post, {
    $pull: { comments: commentId },
  });

  await Comment.findByIdAndDelete(commentId);

  res.status(200).json({ message: "comment deleted successfully" });
});
