-- Replace the broken unsplash image with a working one
UPDATE product_page_images 
SET image_url = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop'
WHERE image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop';