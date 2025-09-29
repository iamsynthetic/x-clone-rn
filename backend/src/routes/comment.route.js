import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createComment,
  getComments,
  deleteComment,
} from "../controllers/comment.controller.js";

const router = express.Router();

router.get("/pst/:postId", getComments);
router.post("/post/:postId", protectRoute, createComment);
router.post("/:commentId", protectRoute, deleteComment);
export default router;
