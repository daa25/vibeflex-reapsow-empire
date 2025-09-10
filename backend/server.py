from fastapi import FastAPI, HTTPException, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum
import os
from pathlib import Path
from dotenv import load_dotenv
import aiohttp
import asyncio
import json

# Import custom integrations
from integrations.shopify_api import ShopifyAPI
from integrations.zencoder_api import ZEncoderAPI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize integrations
shopify_api = ShopifyAPI()
zencoder_api = ZEncoderAPI()

# Create the main app without a prefix
app = FastAPI(title="TampaBay Merch Pro - Multi-Supplier & Shopify Integration API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Enums
class OrderStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"

class ProductStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    out_of_stock = "out_of_stock"

class SupplierType(str, Enum):
    cj_dropshipping = "cj_dropshipping"
    dsers = "dsers"
    autods = "autods"
    printful = "printful"
    printify = "printify"
    gelato = "gelato"
    pietra = "pietra"
    impact_affiliate = "impact_affiliate"
    direct = "direct"

class ProductType(str, Enum):
    physical = "physical"
    print_on_demand = "print_on_demand"
    affiliate = "affiliate"
    digital = "digital"

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class Supplier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: SupplierType
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    webhook_url: Optional[str] = None
    settings: dict = {}
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SupplierCreate(BaseModel):
    name: str
    type: SupplierType
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    webhook_url: Optional[str] = None
    settings: dict = {}

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    cost: float
    sku: str
    supplier_id: str
    supplier_product_id: Optional[str] = None
    supplier_variant_id: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    product_type: ProductType = ProductType.physical
    status: ProductStatus = ProductStatus.active
    stock_quantity: int = 0
    weight: Optional[float] = None
    dimensions: Optional[dict] = None
    affiliate_url: Optional[str] = None
    commission_rate: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    cost: float
    sku: str
    supplier_id: str
    supplier_product_id: Optional[str] = None
    supplier_variant_id: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    product_type: ProductType = ProductType.physical
    stock_quantity: int = 0
    weight: Optional[float] = None
    dimensions: Optional[dict] = None
    affiliate_url: Optional[str] = None
    commission_rate: Optional[float] = None

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = Field(default_factory=lambda: f"ORD-{uuid.uuid4().hex[:8].upper()}")
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    shipping_address: dict
    product_id: str
    supplier_id: str
    quantity: int
    unit_price: float
    total_amount: float
    status: OrderStatus = OrderStatus.pending
    supplier_order_id: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    shipping_address: dict
    product_id: str
    quantity: int

class BulkOrderImport(BaseModel):
    supplier_type: SupplierType
    orders: List[dict]

# CORS configuration
origins = [
    "http://localhost:3000",
    "https://vibeflex-frontend.preview.emergentagent.com",
    os.environ.get('ALLOWED_ORIGINS', '').split(',') if os.environ.get('ALLOWED_ORIGINS') else []
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes

# Status Check Endpoints (existing)
@api_router.get("/")
async def root():
    return {
        "message": "TampaBay Merch Pro - World-Class E-commerce API", 
        "version": "3.0.0",
        "features": [
            "Multi-Supplier Integration",
            "Shopify Sync",
            "ZEncoder Video Processing",
            "Premium Customer Experience"
        ]
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Supplier Management Endpoints
@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier: SupplierCreate):
    supplier_dict = supplier.dict()
    supplier_obj = Supplier(**supplier_dict)
    await db.suppliers.insert_one(supplier_obj.dict())
    return supplier_obj

@api_router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers():
    suppliers = await db.suppliers.find().to_list(1000)
    return [Supplier(**supplier) for supplier in suppliers]

@api_router.get("/suppliers/{supplier_id}", response_model=Supplier)
async def get_supplier(supplier_id: str):
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return Supplier(**supplier)

@api_router.put("/suppliers/{supplier_id}", response_model=Supplier)
async def update_supplier(supplier_id: str, supplier_update: SupplierCreate):
    update_dict = supplier_update.dict()
    update_dict["updated_at"] = datetime.utcnow()
    result = await db.suppliers.update_one(
        {"id": supplier_id}, 
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    updated_supplier = await db.suppliers.find_one({"id": supplier_id})
    return Supplier(**updated_supplier)

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str):
    result = await db.suppliers.delete_one({"id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}

# Enhanced Product Management Endpoints
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    # Verify supplier exists
    supplier = await db.suppliers.find_one({"id": product.supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(supplier_id: Optional[str] = None):
    filter_dict = {}
    if supplier_id:
        filter_dict["supplier_id"] = supplier_id
    
    products = await db.products.find(filter_dict).to_list(1000)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductCreate):
    update_dict = product_update.dict()
    update_dict["updated_at"] = datetime.utcnow()
    result = await db.products.update_one(
        {"id": product_id}, 
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = await db.products.find_one({"id": product_id})
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# Enhanced Order Management Endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    # Check if product exists
    product = await db.products.find_one({"id": order.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get supplier info
    supplier = await db.suppliers.find_one({"id": product["supplier_id"]})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Calculate total amount
    unit_price = product["price"]
    total_amount = unit_price * order.quantity
    
    order_dict = order.dict()
    order_dict.update({
        "supplier_id": product["supplier_id"],
        "unit_price": unit_price,
        "total_amount": total_amount
    })
    
    order_obj = Order(**order_dict)
    await db.orders.insert_one(order_obj.dict())
    
    # TODO: Send order to supplier API
    # await send_order_to_supplier(order_obj, supplier)
    
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(supplier_id: Optional[str] = None, status: Optional[OrderStatus] = None):
    filter_dict = {}
    if supplier_id:
        filter_dict["supplier_id"] = supplier_id
    if status:
        filter_dict["status"] = status
        
    orders = await db.orders.find(filter_dict).sort("created_at", -1).to_list(1000)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: OrderStatus, tracking_number: Optional[str] = None, supplier_order_id: Optional[str] = None):
    update_data = {"status": status, "updated_at": datetime.utcnow()}
    if tracking_number:
        update_data["tracking_number"] = tracking_number
    if supplier_order_id:
        update_data["supplier_order_id"] = supplier_order_id
    
    result = await db.orders.update_one(
        {"id": order_id}, 
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    updated_order = await db.orders.find_one({"id": order_id})
    return Order(**updated_order)

# Bulk Import Endpoints
@api_router.post("/import/products")
async def bulk_import_products(import_data: dict):
    """Import products from CSV data (CJ, DSERS, etc.)"""
    supplier_type = import_data.get("supplier_type")
    products_data = import_data.get("products", [])
    
    if not supplier_type or not products_data:
        raise HTTPException(status_code=400, detail="supplier_type and products data required")
    
    # Find or create supplier
    supplier = await db.suppliers.find_one({"type": supplier_type})
    if not supplier:
        # Create default supplier
        supplier_obj = Supplier(
            name=supplier_type.replace("_", " ").title(),
            type=supplier_type
        )
        await db.suppliers.insert_one(supplier_obj.dict())
        supplier = supplier_obj.dict()
    
    imported_count = 0
    for product_data in products_data:
        try:
            # Map product data based on supplier type
            if supplier_type == "cj_dropshipping":
                product_obj = Product(
                    name=product_data.get("product_name", ""),
                    description=product_data.get("product_name", ""),
                    price=float(product_data.get("price", 0)),
                    cost=float(product_data.get("price", 0)) * 0.5,  # Assume 50% margin
                    sku=product_data.get("sku", ""),
                    supplier_id=supplier["id"],
                    supplier_product_id=product_data.get("sku", ""),
                    stock_quantity=int(product_data.get("quantity", 0))
                )
            elif supplier_type == "dsers":
                product_obj = Product(
                    name=product_data.get("ProductName", ""),
                    description=product_data.get("ProductName", ""),
                    price=float(product_data.get("Price", 0)),
                    cost=float(product_data.get("Price", 0)) * 0.6,  # Assume 40% margin
                    sku=product_data.get("SKU", ""),
                    supplier_id=supplier["id"],
                    supplier_product_id=product_data.get("SKU", ""),
                    stock_quantity=int(product_data.get("Quantity", 0))
                )
            else:
                continue
                
            await db.products.insert_one(product_obj.dict())
            imported_count += 1
        except Exception as e:
            print(f"Error importing product: {e}")
            continue
    
    return {"message": f"Imported {imported_count} products from {supplier_type}"}

@api_router.post("/import/orders")
async def bulk_import_orders(import_data: BulkOrderImport):
    """Import orders from CSV data (CJ, DSERS, etc.)"""
    supplier = await db.suppliers.find_one({"type": import_data.supplier_type})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    imported_count = 0
    for order_data in import_data.orders:
        try:
            # Map order data based on supplier type
            if import_data.supplier_type == "cj_dropshipping":
                order_obj = Order(
                    order_number=order_data.get("order_number", ""),
                    customer_name=f"{order_data.get('recipient_first_name', '')} {order_data.get('recipient_last_name', '')}",
                    customer_email=order_data.get("email", ""),
                    customer_phone=order_data.get("phone", ""),
                    shipping_address={
                        "address1": order_data.get("address1", ""),
                        "address2": order_data.get("address2", ""),
                        "city": order_data.get("city", ""),
                        "state": order_data.get("state", ""),
                        "country": order_data.get("country", ""),
                        "zip": order_data.get("postcode", "")
                    },
                    product_id="",  # Would need to match by SKU
                    supplier_id=supplier["id"],
                    quantity=int(order_data.get("quantity", 1)),
                    unit_price=0,
                    total_amount=0,
                    status=OrderStatus.pending
                )
            elif import_data.supplier_type == "dsers":
                order_obj = Order(
                    order_number=order_data.get("OrderID", ""),
                    customer_name=f"{order_data.get('FirstName', '')} {order_data.get('LastName', '')}",
                    customer_email=order_data.get("Email", ""),
                    customer_phone=order_data.get("Phone", ""),
                    shipping_address={
                        "address1": order_data.get("Address1", ""),
                        "address2": order_data.get("Address2", ""),
                        "city": order_data.get("City", ""),
                        "state": order_data.get("Province", ""),
                        "country": order_data.get("Country", ""),
                        "zip": order_data.get("Zip", "")
                    },
                    product_id="",  # Would need to match by SKU
                    supplier_id=supplier["id"],
                    quantity=int(order_data.get("Quantity", 1)),
                    unit_price=float(order_data.get("Price", 0)),
                    total_amount=float(order_data.get("Price", 0)) * int(order_data.get("Quantity", 1)),
                    status=OrderStatus.processing
                )
            else:
                continue
                
            await db.orders.insert_one(order_obj.dict())
            imported_count += 1
        except Exception as e:
            print(f"Error importing order: {e}")
            continue
    
    return {"message": f"Imported {imported_count} orders from {import_data.supplier_type}"}

# Analytics Dashboard Endpoints
@api_router.get("/analytics/overview")
async def get_analytics_overview():
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_suppliers = await db.suppliers.count_documents({"is_active": True})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    processing_orders = await db.orders.count_documents({"status": "processing"})
    
    # Calculate total revenue
    revenue_pipeline = [
        {"$match": {"status": {"$in": ["shipped", "delivered"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Supplier breakdown
    supplier_stats = []
    suppliers = await db.suppliers.find({"is_active": True}).to_list(100)
    for supplier in suppliers:
        product_count = await db.products.count_documents({"supplier_id": supplier["id"]})
        order_count = await db.orders.count_documents({"supplier_id": supplier["id"]})
        supplier_stats.append({
            "name": supplier["name"],
            "type": supplier["type"],
            "products": product_count,
            "orders": order_count
        })
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_suppliers": total_suppliers,
        "pending_orders": pending_orders,
        "processing_orders": processing_orders,
        "total_revenue": total_revenue,
        "suppliers": supplier_stats
    }

@api_router.get("/analytics/suppliers")
async def get_supplier_analytics():
    """Get performance analytics by supplier"""
    pipeline = [
        {
            "$lookup": {
                "from": "suppliers",
                "localField": "supplier_id",
                "foreignField": "id",
                "as": "supplier"
            }
        },
        {
            "$unwind": "$supplier"
        },
        {
            "$group": {
                "_id": "$supplier_id",
                "supplier_name": {"$first": "$supplier.name"},
                "supplier_type": {"$first": "$supplier.type"},
                "total_orders": {"$sum": 1},
                "total_revenue": {"$sum": "$total_amount"},
                "avg_order_value": {"$avg": "$total_amount"}
            }
        }
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(100)
    return results

# Integration Helper Functions
async def sync_supplier_products(supplier_id: str):
    """Sync products from supplier API"""
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier or not supplier.get("api_endpoint"):
        return {"error": "Supplier not found or no API endpoint configured"}
    
    # TODO: Implement specific API integrations for each supplier
    return {"message": "Product sync not implemented for this supplier"}

async def send_order_to_supplier(order: Order, supplier: dict):
    """Send order to supplier for fulfillment"""
    # TODO: Implement specific order submission for each supplier type
    pass

# Shopify Integration Endpoints
@api_router.get("/shopify/products")
async def get_shopify_products():
    """Get all products from Shopify"""
    products = await shopify_api.get_products()
    return {"products": products, "count": len(products)}

@api_router.post("/shopify/sync-products")
async def sync_products_to_shopify():
    """Sync internal products to Shopify"""
    # Get all internal products
    products = await db.products.find().to_list(1000)
    
    # Convert to format suitable for Shopify
    shopify_products = []
    for product in products:
        shopify_products.append(Product(**product).dict())
    
    result = await shopify_api.sync_products_to_shopify(shopify_products)
    return result

@api_router.get("/shopify/orders")
async def get_shopify_orders():
    """Get all orders from Shopify"""
    orders = await shopify_api.get_orders()
    return {"orders": orders, "count": len(orders)}

@api_router.post("/shopify/setup-webhooks")
async def setup_shopify_webhooks():
    """Setup Shopify webhooks for real-time sync"""
    base_url = os.environ.get('API_BASE_URL', 'http://localhost:8001')
    result = await shopify_api.setup_webhooks(base_url)
    return {"webhooks_created": len(result), "results": result}

# Shopify Webhook Handlers
@api_router.post("/webhooks/shopify/orders/create")
async def handle_shopify_order_create(request: Request):
    """Handle new order webhook from Shopify"""
    payload = await request.json()
    
    # Create internal order record
    shopify_order = payload
    internal_order = Order(
        order_number=shopify_order.get('name', shopify_order.get('id')),
        customer_name=f"{shopify_order.get('billing_address', {}).get('first_name', '')} {shopify_order.get('billing_address', {}).get('last_name', '')}",
        customer_email=shopify_order.get('email', ''),
        customer_phone=shopify_order.get('billing_address', {}).get('phone', ''),
        shipping_address=shopify_order.get('shipping_address', {}),
        product_id="", # Would need to match line items to internal products
        supplier_id="", # Would determine from product mapping
        quantity=sum([int(item.get('quantity', 0)) for item in shopify_order.get('line_items', [])]),
        unit_price=float(shopify_order.get('total_price', 0)),
        total_amount=float(shopify_order.get('total_price', 0)),
        status=OrderStatus.pending
    )
    
    await db.orders.insert_one(internal_order.dict())
    return {"message": "Order processed", "order_id": internal_order.id}

@api_router.post("/webhooks/shopify/orders/paid")
async def handle_shopify_order_paid(request: Request):
    """Handle order paid webhook from Shopify"""
    payload = await request.json()
    
    # Update order status to processing and trigger fulfillment
    shopify_order_id = payload.get('id')
    order_name = payload.get('name')
    
    # Find and update internal order
    result = await db.orders.update_one(
        {"order_number": order_name},
        {"$set": {"status": OrderStatus.processing, "updated_at": datetime.utcnow()}}
    )
    
    # TODO: Trigger supplier fulfillment
    
    return {"message": "Order payment processed", "updated": result.modified_count > 0}

# ZEncoder Integration Endpoints
@api_router.post("/zencoder/create-hero-video")
async def create_hero_video():
    """Create cinematic hero video for the storefront"""
    hero_images = [
        "https://images.unsplash.com/photo-1577223625816-7546f13df25d",
        "https://images.unsplash.com/photo-1671759938110-786b3ff559ef",
        "https://images.unsplash.com/photo-1721009714209-aec1e65ce196"
    ]
    
    result = await zencoder_api.create_hero_video(hero_images)
    return result

@api_router.post("/zencoder/optimize-product-images")
async def optimize_product_images():
    """Optimize all product images"""
    products = await db.products.find({"image_url": {"$exists": True, "$ne": None}}).to_list(100)
    image_urls = [p["image_url"] for p in products if p.get("image_url")]
    
    result = await zencoder_api.optimize_product_images(image_urls)
    return {"optimized": len(result), "jobs": result}

@api_router.post("/zencoder/create-product-video/{product_id}")
async def create_product_video(product_id: str, template: str = "sports"):
    """Create a video showcase for a specific product"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    result = await zencoder_api.create_product_video(product, template)
    return result

@api_router.post("/zencoder/create-marketing-content")
async def create_marketing_content(content_type: str, assets: dict):
    """Create marketing content like social media videos"""
    result = await zencoder_api.create_marketing_content(content_type, assets)
    return result

@api_router.post("/webhooks/zencoder/job_complete")
async def handle_zencoder_job_complete(request: Request):
    """Handle ZEncoder job completion webhook"""
    payload = await request.json()
    
    # Store the completed job info
    job_result = {
        "job_id": payload.get("job", {}).get("id"),
        "state": payload.get("job", {}).get("state"),
        "outputs": payload.get("job", {}).get("outputs", []),
        "completed_at": datetime.utcnow()
    }
    
    await db.zencoder_jobs.insert_one(job_result)
    return {"message": "Job completion processed"}

# Include the router in the main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)