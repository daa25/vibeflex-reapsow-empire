import os
import aiohttp
import asyncio
from typing import Dict, List, Optional
import json

class ZEncoderAPI:
    def __init__(self):
        self.client_id = "a9a4cc44-9e28-466b-9250-a29858145587"
        self.secret_key = "155632cf-054f-489c-8505-b21ab5398924"
        self.base_url = "https://api.zencoder.com/v2"
        
    async def get_headers(self):
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    async def authenticate(self) -> str:
        """Get authentication token"""
        auth_data = {
            "client_id": self.client_id,
            "client_secret": self.secret_key,
            "grant_type": "client_credentials"
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/oauth/token",
                    json=auth_data,
                    headers=await self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('access_token')
                    else:
                        print(f"ZEncoder auth failed: {response.status}")
                        return None
            except Exception as e:
                print(f"ZEncoder auth error: {e}")
                return None
    
    async def create_encoding_job(self, input_video_url: str, output_settings: Dict) -> Dict:
        """Create a video encoding job"""
        token = await self.authenticate()
        if not token:
            return {"error": "Authentication failed"}
        
        headers = await self.get_headers()
        headers['Authorization'] = f'Bearer {token}'
        
        job_data = {
            "input": input_video_url,
            "outputs": [
                {
                    "label": "web_optimized",
                    "format": "mp4",
                    "video_codec": "h264",
                    "audio_codec": "aac",
                    "quality": 4,
                    "width": 1920,
                    "height": 1080,
                    "frame_rate": 30,
                    "audio_bitrate": 128,
                    "public": True,
                    **output_settings
                }
            ],
            "notifications": [
                {
                    "url": f"{os.environ.get('API_BASE_URL', 'http://localhost:8001')}/api/webhooks/zencoder/job_complete",
                    "format": "json"
                }
            ]
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/jobs",
                    json=job_data,
                    headers=headers
                ) as response:
                    return await response.json()
            except Exception as e:
                return {"error": f"Encoding job creation failed: {str(e)}"}
    
    async def get_job_status(self, job_id: str) -> Dict:
        """Get the status of an encoding job"""
        token = await self.authenticate()
        if not token:
            return {"error": "Authentication failed"}
        
        headers = await self.get_headers()
        headers['Authorization'] = f'Bearer {token}'
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{self.base_url}/jobs/{job_id}",
                    headers=headers
                ) as response:
                    return await response.json()
            except Exception as e:
                return {"error": f"Job status check failed: {str(e)}"}
    
    async def create_hero_video(self, input_images: List[str], audio_url: str = None) -> Dict:
        """Create a cinematic hero video from images"""
        # This would create a video montage from images
        # For now, we'll create a simple slideshow effect
        
        output_settings = {
            "label": "hero_video",
            "format": "mp4",
            "video_codec": "h264",
            "audio_codec": "aac" if audio_url else None,
            "quality": 5,  # High quality
            "width": 1920,
            "height": 1080,
            "frame_rate": 24,  # Cinematic frame rate
            "duration": 15,  # 15 second hero video
            "watermark": {
                "url": "https://your-logo-url.com/logo.png",
                "x": "-10",
                "y": "-10",
                "width": "100",
                "height": "40"
            }
        }
        
        if audio_url:
            output_settings["audio_mix"] = audio_url
        
        # Use first image as primary input (simplified)
        input_url = input_images[0] if input_images else "https://images.unsplash.com/photo-1577223625816-7546f13df25d"
        
        return await self.create_encoding_job(input_url, output_settings)
    
    async def optimize_product_images(self, image_urls: List[str]) -> List[Dict]:
        """Optimize product images for web"""
        results = []
        
        for image_url in image_urls:
            output_settings = {
                "label": "product_image_optimized",
                "format": "jpg",
                "quality": 4,
                "width": 800,
                "height": 800,
                "aspect_mode": "crop",
                "public": True
            }
            
            result = await self.create_encoding_job(image_url, output_settings)
            results.append(result)
        
        return results
    
    async def create_product_video(self, product_data: Dict, template: str = "sports") -> Dict:
        """Create a product showcase video"""
        templates = {
            "sports": {
                "duration": 10,
                "style": "dynamic",
                "effects": ["zoom_in", "fade_transition"],
                "text_overlay": True
            },
            "premium": {
                "duration": 15,
                "style": "elegant",
                "effects": ["slow_zoom", "cross_fade"],
                "text_overlay": True
            }
        }
        
        template_config = templates.get(template, templates["sports"])
        
        output_settings = {
            "label": f"product_video_{product_data.get('sku', 'unknown')}",
            "format": "mp4",
            "video_codec": "h264",
            "quality": 4,
            "width": 1080,
            "height": 1080,  # Square for social media
            "frame_rate": 30,
            "duration": template_config["duration"],
            "text_overlay": {
                "text": product_data.get('name', ''),
                "font_size": 48,
                "font_color": "ffffff",
                "x": "center",
                "y": "bottom",
                "background": "00000080"
            }
        }
        
        input_url = product_data.get('image_url', 'https://via.placeholder.com/800x800/333/fff?text=Product')
        
        return await self.create_encoding_job(input_url, output_settings)
    
    async def create_marketing_content(self, content_type: str, assets: Dict) -> Dict:
        """Create marketing content like social media videos"""
        content_configs = {
            "instagram_story": {
                "width": 1080,
                "height": 1920,
                "duration": 15,
                "format": "mp4"
            },
            "facebook_ad": {
                "width": 1200,
                "height": 628,
                "duration": 30,
                "format": "mp4"
            },
            "youtube_short": {
                "width": 1080,
                "height": 1920,
                "duration": 60,
                "format": "mp4"
            }
        }
        
        config = content_configs.get(content_type, content_configs["instagram_story"])
        
        output_settings = {
            "label": f"marketing_{content_type}",
            **config,
            "video_codec": "h264",
            "audio_codec": "aac",
            "quality": 4,
            "public": True
        }
        
        input_url = assets.get('background_image', 'https://images.unsplash.com/photo-1577223625816-7546f13df25d')
        
        return await self.create_encoding_job(input_url, output_settings)