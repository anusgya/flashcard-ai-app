"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { MoreVertical } from "lucide-react";
import useMe from "@/hooks/api/use-me";
import { Badge } from "./badge";
import { Separator } from "./separator";
import { motion } from "framer-motion";

interface Comment {
  id: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  created_at: string;
  replies?: Comment[];
}

interface DiscussionThreadProps {
  comments: Comment[];
  onAddComment?: (content: string, parentId?: string) => void;
  onUpdateComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  creatorId?: string;
}

export function DiscussionThread({
  comments = [],
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  creatorId,
}: DiscussionThreadProps) {
  const [newComment, setNewComment] = useState("");
  const { user } = useMe();

  const handleAddComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment);
      setNewComment("");
    }
  };

  const CommentComponent = ({ comment }: { comment: Comment }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const isAuthor = user?.id === comment.author.id;

    const handleReply = () => {
      if (replyContent.trim() && onAddComment) {
        onAddComment(replyContent, comment.id);
        setReplyContent("");
        setIsReplying(false);
      }
    };

    const handleUpdate = () => {
      if (editedContent.trim() && onUpdateComment) {
        onUpdateComment(comment.id, editedContent);
        setIsEditing(false);
      }
    };

    const handleDelete = () => {
      if (onDeleteComment) {
        onDeleteComment(comment.id);
        setIsDeleteDialogOpen(false);
      }
    };

    return (
      <div className="space-y-2 py-2 px-2">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`/media/avatars/${comment.author.avatar}`} />
            <AvatarFallback className="bg-blue-500 text-white">
              {comment.author.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            {" "}
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[40px] resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={"outline"}
                    className="text-primary-green"
                    onClick={handleUpdate}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className=" border-2 border-divider space-y-2 rounded-lg px-4 bg-card py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-fragment-mono text-secondary-foreground">
                      {comment.author.username}
                    </span>

                    {comment.author.id === creatorId && (
                      <div className=" space-x-1 rounded-full text-[10px]">
                        <span className="text-secondary-foreground">•</span>{" "}
                        <span className="text-primary-blue">Creator</span>
                      </div>
                    )}
                  </div>
                  {isAuthor && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setIsDeleteDialogOpen(true)}
                          className="text-red-500"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <p className=" mt-1 text-sm ">{comment.content}</p>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-secondary-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </span>
              <span className="text-secondary-foreground text-xs ">•</span>
              <Button
                variant="link"
                className="p-0 h-auto text-xs border-0 text-secondary-foreground"
                onClick={() => setIsReplying(!isReplying)}
              >
                Reply
              </Button>
            </div>
            {isReplying && (
              <div className="mt-2 flex items-center gap-2">
                <Textarea
                  placeholder={`Reply to ${comment.author.username}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[20px] resize-none placeholder:text-secondary-foreground"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  onClick={handleReply}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </Button>
              </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-4 border-l-2 border-divider">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="pl-4">
                    <CommentComponent comment={reply} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-secondary-foreground">
                This action cannot be undone. This will permanently delete your
                comment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-0 hover:bg-secondary">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="border-0 text-red-500 hover:bg-secondary"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto pb-40">
      <div className="space-y-2">
        {comments.map((comment, index) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <CommentComponent comment={comment} />
          </motion.div>
        ))}
      </div>

      <div className="fixed bottom-0 left-72 right-0 p-4 bg-background">
        <div className="flex items-center gap-6 max-w-6xl ">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`/media/avatars/${user?.avatar}`} />
            <AvatarFallback className="bg-blue-500 text-white">
              {user?.username?.[0].toUpperCase() || "Y"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center gap-2">
            <Textarea
              placeholder="Join the discussion..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[20px] resize-none placeholder:text-secondary-foreground"
            />
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0"
              onClick={handleAddComment}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
