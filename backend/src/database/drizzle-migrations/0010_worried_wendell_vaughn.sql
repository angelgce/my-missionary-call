ALTER TABLE "blog_post_images" DROP CONSTRAINT IF EXISTS "blog_post_images_post_id_blog_posts_id_fk";--> statement-breakpoint
ALTER TABLE "blog_posts" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "blog_posts" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "blog_post_images" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "blog_post_images" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "blog_post_images" ALTER COLUMN "post_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "blog_post_images" ADD CONSTRAINT "blog_post_images_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ALTER COLUMN "author" SET DEFAULT 'Hermana Tarazona';
