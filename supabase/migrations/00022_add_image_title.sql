ALTER TABLE public.generated_images ADD COLUMN title TEXT;
CREATE UNIQUE INDEX idx_generated_images_user_title ON public.generated_images(user_id, title);