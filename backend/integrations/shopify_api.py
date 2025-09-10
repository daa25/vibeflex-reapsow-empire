import os
import aiohttp
import asyncio
from typing import List, Dict, Optional
import json
from datetime import datetime

class ShopifyAPI:
    def __init__(self):
        self.shop_url = os.environ.get('SHOPIFY_STORE', '59bf48-92.myshopify.com')
        self.access_token = os.environ.get('SHOPIFY_ADMIN_TOKEN')
        self.api_version = '2024-01'
        self.base_url = f"https://{self.shop_url}/admin/api/{self.api_version}"
        
    async def get_headers(self):
        return {
            'X-Shopify-Access-Token': self.access_token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None):
        """Make authenticated request to Shopify API"""
        url = f"{self.base_url}/{endpoint}"
        headers = await self.get_headers()
        
        async with aiohttp.ClientSession() as session:
            try:
                if method.upper() == 'GET':
                    async with session.get(url, headers=headers) as response:
                        return await response.json()
                elif method.upper() == 'POST':
                    async with session.post(url, headers=headers, json=data) as response:
                        return await response.json()
                elif method.upper() == 'PUT':
                    async with session.put(url, headers=headers, json=data) as response:
                        return await response.json()
                elif method.upper() == 'DELETE':
                    async with session.delete(url, headers=headers) as response:
                        return response.status == 200
            except Exception as e:
                print(f"Shopify API error: {e}")
                return None
    
    async def get_products(self, limit: int = 250) -> List[Dict]:
        """Fetch all products from Shopify"""
        products = []
        page_info = None
        
        while True:
            endpoint = f"products.json?limit={limit}"
            if page_info:
                endpoint += f"&page_info={page_info}"
                
            response = await self.make_request('GET', endpoint)
            if not response or 'products' not in response:
                break
                
            products.extend(response['products'])
            
            # Check for pagination
            if len(response['products']) < limit:
                break
                
            # Get next page info from Link header (simplified)
            page_info = None  # Would need to parse Link header properly
            break  # For now, just get first page
            
        return products
    
    async def create_product(self, product_data: Dict) -> Dict:
        """Create a new product in Shopify"""
        shopify_product = {
            "product": {
                "title": product_data.get('name'),
                "body_html": product_data.get('description', ''),
                "vendor": "TampaBay Merch",
                "product_type": product_data.get('category', 'Sports Merchandise'),
                "status": "active" if product_data.get('status') == 'active' else "draft",
                "variants": [{
                    "price": str(product_data.get('price', 0)),
                    "inventory_quantity": product_data.get('stock_quantity', 0),
                    "sku": product_data.get('sku', ''),
                    "inventory_management": "shopify",
                    "inventory_policy": "deny"
                }],
                "tags": ",".join(product_data.get('tags', [])),
                "metafields": [
                    {
                        "namespace": "tampabay_merch",
                        "key": "supplier_id", 
                        "value": product_data.get('supplier_id', ''),
                        "type": "single_line_text_field"
                    },
                    {
                        "namespace": "tampabay_merch",
                        "key": "product_type",
                        "value": product_data.get('product_type', 'physical'),
                        "type": "single_line_text_field"
                    }
                ]
            }
        }
        
        if product_data.get('image_url'):
            shopify_product["product"]["images"] = [{
                "src": product_data['image_url'],
                "alt": product_data.get('name', '')
            }]
            
        return await self.make_request('POST', 'products.json', shopify_product)
    
    async def update_product(self, shopify_product_id: str, product_data: Dict) -> Dict:
        """Update an existing product in Shopify"""
        shopify_product = {
            "product": {
                "id": shopify_product_id,
                "title": product_data.get('name'),
                "body_html": product_data.get('description', ''),
                "product_type": product_data.get('category', 'Sports Merchandise'),
                "status": "active" if product_data.get('status') == 'active' else "draft",
                "tags": ",".join(product_data.get('tags', []))
            }
        }
        
        return await self.make_request('PUT', f'products/{shopify_product_id}.json', shopify_product)
    
    async def get_orders(self, status: str = 'any', limit: int = 250) -> List[Dict]:
        """Fetch orders from Shopify"""
        endpoint = f"orders.json?status={status}&limit={limit}"
        response = await self.make_request('GET', endpoint)
        return response.get('orders', []) if response else []
    
    async def create_order(self, order_data: Dict) -> Dict:
        """Create a new order in Shopify (for testing/admin purposes)"""
        shopify_order = {
            "order": {
                "email": order_data.get('customer_email'),
                "line_items": [{
                    "variant_id": order_data.get('variant_id'),
                    "quantity": order_data.get('quantity', 1),
                    "price": str(order_data.get('unit_price', 0))
                }],
                "billing_address": order_data.get('shipping_address', {}),
                "shipping_address": order_data.get('shipping_address', {}),
                "financial_status": "pending",
                "fulfillment_status": None
            }
        }
        
        return await self.make_request('POST', 'orders.json', shopify_order)
    
    async def update_order_fulfillment(self, order_id: str, tracking_number: str = None) -> Dict:
        """Update order fulfillment status"""
        fulfillment_data = {
            "fulfillment": {
                "location_id": await self.get_default_location_id(),
                "tracking_number": tracking_number,
                "notify_customer": True
            }
        }
        
        return await self.make_request('POST', f'orders/{order_id}/fulfillments.json', fulfillment_data)
    
    async def get_default_location_id(self) -> str:
        """Get the default location ID for fulfillments"""
        response = await self.make_request('GET', 'locations.json')
        if response and 'locations' in response and len(response['locations']) > 0:
            return response['locations'][0]['id']
        return None
    
    async def sync_products_to_shopify(self, products: List[Dict]) -> Dict:
        """Sync internal products to Shopify"""
        results = {
            'created': 0,
            'updated': 0,
            'errors': []
        }
        
        # Get existing Shopify products
        shopify_products = await self.get_products()
        shopify_skus = {p['variants'][0]['sku']: p for p in shopify_products if p.get('variants')}
        
        for product in products:
            try:
                sku = product.get('sku')
                if sku in shopify_skus:
                    # Update existing product
                    shopify_product_id = shopify_skus[sku]['id']
                    await self.update_product(shopify_product_id, product)
                    results['updated'] += 1
                else:
                    # Create new product
                    await self.create_product(product)
                    results['created'] += 1
                    
            except Exception as e:
                results['errors'].append(f"Error syncing {product.get('name', 'Unknown')}: {str(e)}")
        
        return results
    
    async def get_webhooks(self) -> List[Dict]:
        """Get all webhooks"""
        response = await self.make_request('GET', 'webhooks.json')
        return response.get('webhooks', []) if response else []
    
    async def create_webhook(self, topic: str, address: str) -> Dict:
        """Create a webhook for real-time updates"""
        webhook_data = {
            "webhook": {
                "topic": topic,
                "address": address,
                "format": "json"
            }
        }
        
        return await self.make_request('POST', 'webhooks.json', webhook_data)
    
    async def setup_webhooks(self, base_url: str) -> List[Dict]:
        """Setup essential webhooks for real-time sync"""
        webhooks_to_create = [
            ('orders/create', f"{base_url}/api/webhooks/shopify/orders/create"),
            ('orders/updated', f"{base_url}/api/webhooks/shopify/orders/updated"),
            ('orders/paid', f"{base_url}/api/webhooks/shopify/orders/paid"),
            ('orders/fulfilled', f"{base_url}/api/webhooks/shopify/orders/fulfilled"),
            ('products/create', f"{base_url}/api/webhooks/shopify/products/create"),
            ('products/update', f"{base_url}/api/webhooks/shopify/products/update"),
        ]
        
        results = []
        existing_webhooks = await self.get_webhooks()
        existing_addresses = {w['address'] for w in existing_webhooks}
        
        for topic, address in webhooks_to_create:
            if address not in existing_addresses:
                result = await self.create_webhook(topic, address)
                results.append(result)
                
        return results